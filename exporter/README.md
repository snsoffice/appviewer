# 创建JSON转换插件

## 创建类文件

```
  mkdir -p com/eteks/sweethome3d/plugin/exportjson
  
  cd com/eteks/sweethome3d/plugin/exportjson
  
  # Create file:  ApplicationPlugin.properties
  # Create file: ExportJSONPlugin.java
  
```

## 编译成为 class

```
  javac -cp SweetHome3D-5.6.jar ExportHomePlugin.java
```

## 压缩 com 目录为 .sh3p 文件

把整个 com 目录压缩成为一个 .sh3p 的文件，双击就可以导入到 sweethome3d 里面。

或者拷贝到 C:\Documents and Settings\user\Application Data\eTeks\Sweet Home 3D\plugins，再次启动的时候就会导入这个插件。


## 创建命令行应用

如果需要从命令行直接运行，那么使用下面的方式

```
  cd com/eteks/sweethome3d/plugin/exportjson
  
  # Create file: Exporter
  # 

  # cd com 所在的目录
  javac -cp SweetHome3D-5.6.jar com/eteks/sweethome3d/plugin/exportjson
  
  # 压缩 com 目录为 exporter.zip
  
  # 运行
  java -cp "SweetHome3D-5.6.jar;exporter.zip" com.eteks.sweethome3d.plugin.exportjson.Exporter
  
```

## 参考手册

* 教程

http://www.sweethome3d.com/pluginDeveloperGuide.jsp

* API

http://www.sweethome3d.com/javadoc/index.html
