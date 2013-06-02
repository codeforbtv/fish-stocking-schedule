#!/usr/local/bin/python

from boto.s3.connection import S3Connection
from boto.s3.key import Key
import os
import hashlib
import gzip
import time

SUB_BUCKET = '' # This will be part of url, i.e. apps/SUB_BUCKET/...
EXPIRES = 60 # days
IGNORE_DIRS = ['.git', 'venv']
IGNORE_FILES = ['.DS_Store', '.gitignore']
IGNORE_FILE_TYPES = ['.gz', '.pyc', '.py', '.md', '.rb', '.scss']
AWS_KEY = 'AKIAIL6DJPWZAVLJAAHQ'
AWS_SECRET_KEY = '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'
AWS_BUCKET = 'vt-stock-exchange'

def upload_static(directory='.'):
    file_list = []
    for root, dirs, files in os.walk(directory):
        for d in IGNORE_DIRS:
            if d in dirs:
                dirs.remove(d)
        for f in IGNORE_FILES:
            if f in files:
                files.remove(f)
        for f in files:
            ext = os.path.splitext(f)[1]
            if ext in IGNORE_FILE_TYPES:
                files.remove(f)


        file_list.append((root, files))

    s3_list = []
    for f in file_list:
        for i in f[1]:
            ext = os.path.splitext(i)[1]
            if ext in IGNORE_FILE_TYPES:
                pass
            else:
                if f[0] is not '.':
                    s3_list.append(f[0] + '/' + i)
                else:
                    s3_list.append(i)

    content_types = {
                    '.css': 'text/css',
                    '.js': 'text/javascript',
                    '.png': 'image/png',
                    '.ico': 'image/ico',
                    '.csv': 'text/csv',
                    '.html': 'text/html',
                    '.json': 'text/json'
                    }

    conn = S3Connection(AWS_KEY, AWS_SECRET_KEY)
    mybucket = conn.get_bucket(AWS_BUCKET)
    expires = time.time() + EXPIRES * 24 * 3600
    expires_header = time.strftime("%a, %d-%b-%Y %T GMT", time.gmtime(expires))

    for filename in s3_list:
        k = Key(mybucket)
        ext = os.path.splitext(filename)[1]

        if ext == '.html': # deletes '.html' from s3 key so no ext on url
            k.key = SUB_BUCKET + '/' + os.path.splitext(filename)[0]
        else:
            k.key = SUB_BUCKET + filename # strip leading 0

        # gzip css, js, and html only
        if ext == '.css' or ext == '.js' or ext == '.html':
            f_in = open(filename, 'rb')
            with gzip.open(filename + '.gz', 'w+') as f:
                f.writelines(f_in)
            f_in.close()
            f = filename + '.gz'
            k.set_metadata('Content-Encoding', 'gzip')
        else:
            f = filename

        print filename
        k.set_metadata('Content-Type', content_types[ext])
        k.set_metadata('Expires', expires_header)
        etag_hash = hashlib.sha1(f + str(time.time())).hexdigest()
        k.set_metadata('ETag', etag_hash)
        k.set_contents_from_filename(f)
        k.make_public()

upload_static()
