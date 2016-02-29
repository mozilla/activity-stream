import time
import hashlib
import json
from operator import itemgetter
from distutils.util import strtobool
import boto
from fabric.api import local, env
from boto.s3.key import Key
from pathlib import Path

env.bucket_name = "moz-activity-streams"
S3 = boto.connect_s3()


def to_bool(value):
    if not isinstance(value, bool):
        return strtobool(value)
    else:
        return value


def get_s3_headers():
    return {
        'Cache-Control': 'public, max-age={}'.format(24*60*60),
        'Content-Disposition': 'inline',
    }


def package(signing_key, signing_password):
    local("npm install")
    local("npm run package")
    local("./node_modules/jpm/bin/jpm sign --api-key {} --api-secret {}"
          .format(signing_key, signing_password))
    local("mv activity_streams_experiment-*.xpi dist/")
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

    print "uploading {}".format(dir_path)
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


def deploy(run_package=True, signing_key=None, signing_password=None):
    if not (signing_key is not None and signing_password is not None):
        with open(".amo_config.json", "r") as f:
            amo_config = json.load(f)
            signing_key = amo_config["api-key"]
            signing_password = amo_config["api-secret"]

    start = time.time()

    run_package = to_bool(run_package)
    end_signing = None
    if run_package:
        package(signing_key, signing_password)
        end_signing = time.time()

    latest = get_latest_package_path()

    key, latest, update_manifest = upload_to_s3(env.bucket_name, latest)
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
