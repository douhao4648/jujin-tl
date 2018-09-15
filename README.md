# jujin-tl

## 项目描述

* jujin-tl 是生成聚金前端多语配置文件的小工具

## 先决条件

* node v8.x

## 开发步骤

* A. 下载构建工具

> 通过 npm install -g jujin-tl 安装。

* B. 生成某个前端模块下的多语文件

> 进入项目 xxx 的前端源码 src 目录，找到想要生成多语文件的模块，并进入其内；在模块目录下打开命令行工具，使用 jjtl build 生成多语文件。
 
## 项目说明

* 注意事项

> 该工具目前只支持某个目录子级文件的多语生成，并未递归处理下级目录结构。

* 命令详解

a. jjtl build [-i|-o]

> -i 参数表示 欲生成多语配置文件的代码目录 默认为命令行当前所在的目录。
>
> -o 参数表示 生成多语配置文件的存放地址 默认在命令行当前所在目录 dist 文件夹下。
>