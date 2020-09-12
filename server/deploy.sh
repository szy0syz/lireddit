#!/bin/bash

echo 请输入你要发布的版本号 ?
read VERSION

rm -rf ./dist
yarn build
docker build -t registry.cn-hangzhou.aliyuncs.com/szy0syz/lireddit-api:$VERSION .
docker push registry.cn-hangzhou.aliyuncs.com/szy0syz/lireddit-api:$VERSION
ssh root@nykj "docker pull registry.cn-hangzhou.aliyuncs.com/szy0syz/lireddit-api:$VERSION && docker tag registry.cn-hangzhou.aliyuncs.com/szy0syz/lireddit-api:$VERSION dokku/lireddit-api:latest && dokku deploy lireddit-api latest"
