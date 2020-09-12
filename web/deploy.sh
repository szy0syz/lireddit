#!/bin/bash

echo 请输入你要发布的版本号 ?
read VERSION

docker build -t registry.cn-hangzhou.aliyuncs.com/szy0syz/lireddit-ui:$VERSION .
docker push registry.cn-hangzhou.aliyuncs.com/szy0syz/lireddit-ui:$VERSION
ssh root@nykj "docker pull registry.cn-hangzhou.aliyuncs.com/szy0syz/lireddit-ui:$VERSION && docker tag registry.cn-hangzhou.aliyuncs.com/szy0syz/lireddit-ui:$VERSION dokku/lireddit:latest && dokku deploy lireddit latest"
