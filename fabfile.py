import os
import time
import hashlib
import json
from operator import itemgetter
from distutils.util import strtobool
import boto
from fabric.api import local, env, hide
from boto.s3.key import Key
from pathlib import Path

env.bucket_name = "moz-activity-streams"
env.bucket_name_dev = "moz-activity-streams-dev"
S3 = boto.connect_s3()

DEV_BUCKET_URL = "https://moz-activity-streams-dev.s3.amazonaws.com"
DEV_UPDATE_LINK = "{}/dist/activity-streams-latest.xpi".format(DEV_BUCKET_URL)
DEV_UPDATE_URL = "{}/dist/update.rdf".format(DEV_BUCKET_URL)


def make_dev_manifest(fresh_manifest=True):
    if to_bool(fresh_manifest):
        restore_manifest()

    with open("./package.json", "r+") as f:
        current_time = int(time.time())
        manifest = json.load(f)
        manifest["title"] = "{} Dev".format(manifest["title"])
        manifest["updateLink"] = DEV_UPDATE_LINK
        manifest["updateURL"] = DEV_UPDATE_URL
        manifest["version"] = "{}-dev-{}".format(
            manifest["version"], current_time)
        f.seek(0)
        f.truncate(0)
        json.dump(manifest, f,
                  sort_keys=True, indent=2, separators=(',', ': '))


def restore_manifest():
    local("git checkout -- ./package.json")


def to_bool(value):
    if not isinstance(value, bool):
        try:
            return strtobool(value)
        except:
            return True if value else False
    else:
        return value


def get_s3_headers():
    return {
        'Cache-Control': 'public, max-age={}'.format(24*60*60),
        'Content-Disposition': 'inline',
    }


def package(signing_key, signing_password):
    try:
        print "Cleaning local artifacts"
        local("rm *.rdf")
        local("rm *.xpi")
    except:
        print "Nothing to clean"
    local("npm install")
    local("npm run package")
    print "signing..."
    with hide("running"):
        local("./node_modules/jpm/bin/jpm sign --api-key {} --api-secret {}"
              .format(signing_key, signing_password))
    print "signing successful!"
    local("mv activity-streams-*.xpi dist/")
    local("mv \@activity-streams-*.update.rdf dist/update.rdf")
    local("rm dist/activity-streams-*.xpi")


def get_packages():
    dist_dir = Path("./dist")
    paths = [(p, p.stat().st_mtime)
             for p in dist_dir.rglob("*.xpi")
             if p.is_file() and p.stat().st_size]
    return paths


def get_latest_package_path():
    paths = get_packages()
    latest = max(paths, key=itemgetter(1))[0]
    return latest


def upload_to_s3(bucket_name, file_path=None):
    if file_path is None:
        file_path = get_latest_package_path()

    dir_path = file_path.as_posix()
    bucket = S3.get_bucket(bucket_name)

    k = bucket.get_key(dir_path)
    if k is not None:
        # file exists on S3
        md5_hash = hashlib.md5(file_path.open("rb").read()).hexdigest()
        if md5_hash == k.etag[1:-1]:
            # skip if it's the same file
            print "skipping upload for {}".format(dir_path)
            latest = bucket.get_key("dist/activity-streams-latest.xpi")
            update_manifest = bucket.get_key("dist/update.rdf")
            return (k, latest, update_manifest)

    headers = get_s3_headers()
    headers["Content-Type"] = "application/x-xpinstall"

    k = Key(bucket)
    k.name = dir_path
    k.set_contents_from_filename(dir_path, headers=headers)
    k.set_acl("public-read")

    k.copy(bucket_name, "dist/activity-streams-latest.xpi")

    # copy latest key
    latest = bucket.get_key("dist/activity-streams-latest.xpi")
    latest.set_acl("public-read")

    # upload update RDF
    headers = get_s3_headers()
    headers["Content-Type"] = "application/xml"
    update_manifest = Key(bucket)
    update_manifest.name = "dist/update.rdf"
    update_manifest.set_contents_from_filename(
        "./dist/update.rdf", headers=headers)
    update_manifest.set_acl("public-read")

    return (k, latest, update_manifest)


def upload_html_to_s3(bucket_name, file_path=None):
    if file_path is None:
        file_path = "artifacts/latest/latest.html"

    bucket = S3.get_bucket(bucket_name)

    def upload_text():
        headers = get_s3_headers()
        headers["Content-Type"] = "text/html"
        key = Key(bucket)
        key.name = "dist/latest.html"
        key.set_contents_from_filename(file_path, headers=headers)
        key.set_acl("public-read")

    # upload latest html if different
    key = bucket.get_key("dist/latest.html")
    if key is None:
        upload_text()
    else:
        md5_hash = hashlib.md5(open(file_path, "rb").read()).hexdigest()
        if key.etag[1:-1] != md5_hash:
            upload_text()


def deploy(run_package=True, dev_deploy=False,
           signing_key=None, signing_password=None):
    if not (signing_key is not None and signing_password is not None):
        config_path = os.environ.get("AMO_CONFIG_FILE", ".amo_config.json")
        if os.path.isfile(config_path):
            with open(config_path, "r") as f:
                amo_config = json.load(f)
                signing_key = amo_config["api-key"]
                signing_password = amo_config["api-secret"]
        else:
            signing_key = os.environ["AMO_KEY"]
            signing_password = os.environ["AMO_PASSWORD"]

    start = time.time()

    bucket_name = env.bucket_name
    if dev_deploy:
        print "Making Dev deploy"
        bucket_name = env.bucket_name_dev
        make_dev_manifest()

    run_package = to_bool(run_package)
    end_signing = None
    if run_package:
        package(signing_key, signing_password)
        end_signing = time.time()

    if dev_deploy:
        restore_manifest()

    latest = get_latest_package_path()

    print "uploading {} to bucket {}".format(latest, bucket_name)
    key, latest, update_manifest = upload_to_s3(bucket_name, latest)
    upload_html_to_s3(bucket_name, "artifacts/latest/latest.html")
    end = time.time()

    time_taken = int(end-start)

    print "\n===== summary ======"
    print "signing time: {} secs".format(int(end_signing - start))
    print "time taken: {} secs".format(time_taken)
    print "S3 URLs:\n{}\n{}\n{}".format(
        key.generate_url(expires_in=0, query_auth=False),
        latest.generate_url(expires_in=0, query_auth=False),
        update_manifest.generate_url(expires_in=0, query_auth=False),
    )
