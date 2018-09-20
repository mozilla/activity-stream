/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
"use strict";

const {PersistentCache} = ChromeUtils.import("resource://activity-stream/lib/PersistentCache.jsm", {});
const {RemoteSettings} = ChromeUtils.import("resource://services-settings/remote-settings.js", {});

const {NaiveBayesTextTagger} = ChromeUtils.import("resource://activity-stream/lib/NaiveBayesTextTagger.jsm", {});
const {NmfTextTagger} = ChromeUtils.import("resource://activity-stream/lib/NmfTextTagger.jsm", {});
const {RecipeExecutor} = ChromeUtils.import("resource://activity-stream/lib/RecipeExecutor.jsm", {});

ChromeUtils.defineModuleGetter(this, "NewTabUtils",
  "resource://gre/modules/NewTabUtils.jsm");

const STORE_UPDATE_TIME = 24 * 60 * 60 * 1000; // 24 hours

/**
 * V2 provider builds and ranks an interest profile (also called an “interest vector”) off the browse history.
 * This allows Firefox to classify pages into topics, by examining the text found on the page.
 * It does this by looking at the history text content, title, and description.
 */
this.PersonalityProvider = class PersonalityProvider {
  constructor(
    timeSegments,
    parameterSets,
    maxHistoryQueryResults,
    version,
    scores,
    modelKeys) {
    this.modelKeys = modelKeys;
    this.timeSegments = timeSegments;
    this.parameterSets = parameterSets;
    this.maxHistoryQueryResults = maxHistoryQueryResults;
    this.version = version;
    this.scores = scores;
    this.store = new PersistentCache("personality-provider", true);
  }

  async init() {
    this.interestConfig = await this.getRecipe();
    this.recipeExecutor = await this.generateRecipeExecutor();
    this.interestVector = await this.store.get("interest-vector");

    // Fetch a new one if none exists or every set update time.
    if (!this.interestVector ||
      (Date.now() - this.interestVector.lastUpdate) >= STORE_UPDATE_TIME) {
      this.interestVector = await this.createInterestVector();
      this.interestVector.lastUpdate = Date.now();
      this.store.set("interest-vector", this.interestVector);
    }
    this.initialized = true;
  }

  getRemoteSettings(name) {
    return RemoteSettings(name).get();
  }

  getRecipeExecutor(nbTaggers, nmfTaggers) {
    return new RecipeExecutor(nbTaggers, nmfTaggers);
  }

  getNaiveBayesTextTagger(model) {
    return new NaiveBayesTextTagger(model);
  }

  getNmfTextTagger(model) {
    return new NmfTextTagger(model);
  }

  getNewTabUtils() {
    return NewTabUtils;
  }

  /**
   * Returns a Recipe from remote settings to be consumed by a RecipeExecutor.
   * A Recipe is a set of instructions on how to processes a RecipeExecutor.
   */
  async getRecipe() {
    if (!this.recipe) {
      this.recipe = await this.getRemoteSettings("personality-provider-recipe");
    }
    return this.recipe[0];
  }

  /**
   * Returns a Recipe Executor.
   * A Recipe Executor is a set of actions that can be consumed by a Recipe.
   * The Recipe determines the order and specifics of which the actions are called.
   */
  async generateRecipeExecutor() {
    let nbTaggers = [];
    let nmfTaggers = {};
    const models = await this.getRemoteSettings("personality-provider-models");

    for (let model of models) {
      if (!model || !this.modelKeys.includes(model.key)) {
        continue;
      }

      if (model.data.model_type === "nb") {
        nbTaggers.push(this.getNaiveBayesTextTagger(model.data));
      } else if (model.data.model_type === "nmf") {
        nmfTaggers[model.data.parent_tag] = this.getNmfTextTagger(model.data);
      }
    }
    return this.getRecipeExecutor(nbTaggers, nmfTaggers);
  }

  /**
   * Grabs a slice of browse history for building a interest vector
   */
  async fetchHistory(columns, beginTimeSecs, endTimeSecs) {
    let sql = `SELECT *
    FROM moz_places
    WHERE last_visit_date >= ${beginTimeSecs * 1000000}
    AND last_visit_date < ${endTimeSecs * 1000000}`;
    columns.forEach(requiredColumn => {
      sql += ` AND ${requiredColumn} <> ""`;
    });

    const {activityStreamProvider} = this.getNewTabUtils();
    const history = await activityStreamProvider.executePlacesQuery(sql, {
      columns,
      params: {},
    });

    return history;
  }

  /**
   * Examines the user's browse history and returns an interest vector that
   * describes the topics the user frequently browses.
   */
  async createInterestVector() {
    let interestVector = {};
    let endTimeSecs = ((new Date()).getTime() / 1000);
    let beginTimeSecs = endTimeSecs - this.interestConfig.history_limit_secs;
    let history = await this.fetchHistory(this.interestConfig.history_required_fields, beginTimeSecs, endTimeSecs);

    for (let historyRec of history) {
      let ivItem = this.recipeExecutor.executeRecipe(historyRec, this.interestConfig.history_item_builder);
      if (ivItem === null) {
        continue;
      }
      interestVector = this.recipeExecutor.executeCombinerRecipe(
        interestVector,
        ivItem,
        this.interestConfig.interest_combiner);
      if (interestVector === null) {
        return null;
      }
    }

    let xxx =  this.recipeExecutor.executeRecipe(interestVector, this.interestConfig.interest_finalizer);
    console.log("FINAL IV ", xxx);
    return xxx;
  }

  /**
   * Calculates a score of a Pocket item when compared to the user's interest
   * vector. Returns the score. Higher scores are better. Assumes this.interestVector
   * is populated.
   */
  calculateItemRelevanceScore(pocketItem) {
    console.log("scoring", pocketItem.url, "((", pocketItem.title, "))", this.interestConfig.item_to_rank_builder);
    let scorableItem = this.recipeExecutor.executeRecipe(pocketItem, this.interestConfig.item_to_rank_builder);
    if (scorableItem === null) {
      return -1;
    }
    let rankingVector = JSON.parse(JSON.stringify(this.interestVector));
    console.log("first:", rankingVector);
    Object.keys(scorableItem).forEach(key => {
      rankingVector[key] = scorableItem[key];
    });
    console.log("second:", rankingVector);
    rankingVector = this.recipeExecutor.executeRecipe(rankingVector, this.interestConfig.item_ranker);

    console.log("third:", rankingVector);
    if (rankingVector === null) {
      console.log("ERROR !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
      return -1;
    }
    console.log("scored", rankingVector.score);
    return rankingVector.score;
  }

  /**
   * Returns an object holding the settings and affinity scores of this provider instance.
   */
  getAffinities() {
    return {
      timeSegments: this.timeSegments,
      parameterSets: this.parameterSets,
      maxHistoryQueryResults: this.maxHistoryQueryResults,
      version: this.version,
      scores: true,
    };
  }
};

const EXPORTED_SYMBOLS = ["PersonalityProvider"];
