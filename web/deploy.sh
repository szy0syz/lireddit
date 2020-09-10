#!/bin/bash

echo 请输入你要发布的版本号 ?
read VERSION

docker build -t szy0syz/lireddit-ui:$VERSION .
docker push szy0syz/lireddit-ui:$VERSION
ssh root@nykj "docker pull szy0syz/lireddit-ui:$VERSION && docker tag szy0syz/lireddit-ui:$VERSION dokku/lireddit:latest && dokku deploy lireddit latest"
