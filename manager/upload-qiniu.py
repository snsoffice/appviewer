# -*- coding: utf-8 -*-
# 
# 避免输出中文乱码，使用下面的命令运行
#
#     PYTHONIOENCODING=UTF-8 c:/Python34/python upload.py ...
#

import argparse
import logging
import os
import sys

from qiniu import Auth, put_file, etag, urlsafe_base64_encode
import qiniu.config
from qiniu.compat import is_py2, is_py3

# 需要填写你的 Access Key 和 Secret Key
access_key = 'QFgSb93d8-jgKpKmqnXPsIb2CntjxmZJOo7mZpOg'
secret_key = '_AOrXX3Y05HwCdXk-dfl816HJnX8eecYN2KHk2xP'

def main(params=None):
    parser = argparse.ArgumentParser(description='上传文件到七牛云')
    parser.add_argument('filenames', metavar='FILENAME', nargs='+', help='上传文件名称')
    parser.add_argument('--path', default='', help='上传文件所在的路径')
    parser.add_argument('--bucket', default='plone-house', help='要上传的空间名称')
    parser.add_argument('--prefix', help='保存的文件前缀')
    args = parser.parse_args(params)

    # 构建鉴权对象
    q = Auth(access_key, secret_key)

    # 要上传的空间
    bucket_name = args.bucket
    bucket_url = 'http://owtayt1td.bkt.clouddn.com'
    logging.info('上传文件到七牛云空间 %s', bucket_name)

    prefix = args.prefix
    path = args.path

    filelist = []
    for filename in args.filenames:

        # 上传到七牛后保存的文件名
        key = filename if prefix is None else '/'.join([prefix, filename])

        # 生成上传 Token，可以指定过期时间等
        token = q.upload_token(bucket_name, key, 3600)

        # 要上传文件的本地路径
        localfile = os.path.join(path, filename)

        logging.info('正在上传文件 %s ...', localfile)
        ret, info = put_file(token, key, localfile)
        if ret['hash'] == etag(localfile):
            logging.info('上传文件成功，保存为 %s', ret['key'])
        else:
            filelist.append(localfile)
            logging.info('上传文件保存为 %s，但是哈希值和本地文件不一致', ret['key'])

        # if is_py2:
        #     assert ret['key'].encode('utf-8') == key
        # elif is_py3:
        #     assert ret['key'] == key

    if len(filelist[:1]):
        logging.info('下列文件上传失败： %s', filelist)
    else:
        logging.info('文件上传成功')

if __name__ == '__main__':
    logging.basicConfig(format='%(asctime)s %(message)s', level=logging.INFO)
    main()
