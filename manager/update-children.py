# -*- coding: utf-8 -*-
#

import argparse
import glob
import json
import logging
import os
import sys

CONFIG_FILENAME = 'config.json'

def list_children(path):
    result = []
    for dirname in os.listdir(path):
        rfilename = os.path.join(path, dirname, CONFIG_FILENAME)
        if os.path.exists(rfilename):
            result.append(dirname)
    return result

def update_house(path):
    logging.info('准备更新 %s ...', path)

    filename = os.path.join(path, CONFIG_FILENAME)
    if not os.path.exists(filename):
        logging.warning('更新失败，没有发现配置文件: %s', CONFIG_FILENAME)
        return
    
    with open(filename, 'r') as f:
        data = json.load(f)
    
    modified = False
    children = list_children(path)
    for dirname in children:
        rfilename = os.path.join(path, dirname, CONFIG_FILENAME)
        with open(rfilename, 'r') as f:
            child = json.load(f)
        record = child['name'], child['longitude'], child['latitude'], child['altitude']
        i = 0
        for item in data['children']:
            if item[0] == child['name']:
                if not item == record:
                    logging.info('更新子项目 %s', dirname)
                    data['children'][i] = record
                    modified = True
                break
            i += 1
        else:
            logging.info('创建新的子项目 %s', dirname)
            modified = True
            data['children'].append(record)
    
    if modified:
        logging.info('保存修改后的配置文件 %s', filename)
        with open(filename, 'w') as f:
            json.dump(data, f)
    logging.info('更新 %s 完成', path)
    return children

def update_children(config):
    root = config.dataPath[0]    
    def _update(path):
        children = update_house(path)
        if children is not None:
            for room in children:
                _update(os.path.join(path, room))
    logging.info('更新数据目录 %s ...', root)
    for house in list_children(root):
        _update(os.path.join(root, house))
    logging.info('更新数据目录 %s 完成', root)

def main(params=None):
    parser = argparse.ArgumentParser(description='更新子房间信息')
    parser.add_argument('dataPath', metavar='PATH', nargs=1, help='保存数据的路径')
    # parser.add_argument('--show', action='store_true', help='在窗口中显示包含关键点的图片')
    # parser.add_argument('--save', action='store_true', help='保存包含关键点的图片')
    # parser.add_argument('--output', help='输出文件的路径')
    # parser.add_argument('--grid', action='store_true', help='使用九宫格获取关键点')
    # parser.add_argument('--mask', help='选择区域（x0, y0, x1, y1)')
    # parser.add_argument('--asift', action='store_true', help='使用asift算法')
    # parser.add_argument('--tilt', type=int, default=asift_tilt, help='设置 asift 的 tilt 参数')
    # parser.add_argument('--feature', choices=['orb', 'sift', 'surf'], default='orb', help='特征名称')
    # parser.add_argument('--nFeatures', metavar='n', type=int, default=800, help='特征数目')
    # parser.add_argument('--pose', help='参考平面和相机距离，水平方位角和相机位置（d,a,x,y,z)')
    # parser.add_argument('--camera', help='相机内参（fx,fy)')
    update_children(parser.parse_args(params))

if __name__ == '__main__':
    logging.basicConfig(format='%(asctime)s %(message)s', level=logging.INFO)
    main()
