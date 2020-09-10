#!/bin/bash

echo 请输入你要发布的版本号 ?
read VERSION

rm -rf ./dist
yarn build
docker build -t szy0syz/lireddit:$VERSION .
docker push szy0syz/lireddit:$VERSION
ssh root@nykj "docker pull szy0syz/lireddit:$VERSION && docker tag szy0syz/lireddit:$VERSION dokku/lireddit-api:latest && dokku deploy lireddit-api latest"
