# 创建JSON转换插件

## 创建类文件

```
  mkdir -p com/eteks/sweethome3d/plugin/exportjson

  cd com/eteks/sweethome3d/plugin/exportjson

  # Create file:  ApplicationPlugin.properties
  # Create file:  ExportJSONPlugin.java

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
  javac -cp SweetHome3D-5.6.jar com/eteks/sweethome3d/plugin/exportjson/Exporter.java

  # 压缩 com 目录为 exporter.jar
  zip -r exporter.jar com/

  # 运行
  java -cp "SweetHome3D-5.6.jar;exporter.jar" com.eteks.sweethome3d.plugin.exportjson.Exporter

  # 如果需要 3D 支持，例如离线输出照片，那么需要指定库所在的位置
  java -D"java.library.path=lib/windows/i386" \
       -cp "SweetHome3D-5.6.jar;lib/j3dcore.jar;lib/j3dutils.jar;lib/vecmath.jar;lib/sunflow-0.07.3i.jar;exporter.jar" \
       com/eteks/sweethome3d/plugin/exportjson/Exporter house.sh3d

```

### 创建图片

类文件 com.eteks.sweethome3d/plugin/export/PhotoMaker.java

```

  # Build
  javac -cp SweetHome3D-5.6.jar com/eteks/sweethome3d/plugin/exporter/PhotoMaker.java
  zip -r exporter.jar com/

  # Run
  java -D"java.library.path=lib/windows/i386" \
       -cp "SweetHome3D-5.6.jar;lib/j3dcore.jar;lib/j3dutils.jar;lib/vecmath.jar;lib/sunflow-0.07.3i.jar;exporter.jar" \
       com/eteks/sweethome3d/plugin/exporter/PhotoMaker OPTIONS FILENAME.sh3d

```

OPTIONS

```
  --camera "Camera Name" or --vision "x,y,z,yaw,pitch,fieldOfView"
  --width N
  --height N
  --output "FILENAME.png"
  --type "PNG" or "JPEG"
  --quality "LOW" or "HIGH"
```

### 导出为图层

类文件 com.eteks.sweethome3d/plugin/export/MapLayer.java

```
  # Build
  javac -cp SweetHome3D-5.6.jar com/eteks/sweethome3d/plugin/exporter/MapLayer.java
  zip -r exporter.jar com/

  # Run
  java -cp "SweetHome3D-5.6.jar;exporter.jar" com/eteks/sweethome3d/plugin/exporter/MapLayer FILENAME.sh3d

```

## 参考手册

* 教程

http://www.sweethome3d.com/pluginDeveloperGuide.jsp

* API

http://www.sweethome3d.com/javadoc/index.html

# SimpleHouseExporter 输出文件格式

这是插件使用的导出方式，生成一个简化版的压缩文件，只包含单个房屋的视图资源

* config.json
* views/plan/plan_house.png
* views/solid/solid_house.jpg
* views/three/*

## config.json

```
{
  "name": "1701",  // 文件名称
  "polygons": [[[-1.642234, 4.390899], [-1.642234, 2.667099], [-0.406531, 2.667099], [-0.406531, 2.628749]]],
  "area": 69.63,   // 所有房屋的面积求和得到，或者计算多边形的面积
  "views":
  [
    {
      "type": "plan",
      "extent": [ -1.731767, -6.329101, 4.504433, 4.467099 ],
      "source": "plan_house.png"
    },
    {
      "type": "three",
      "extent": [ -1.731767, -6.329101, 4.504433, 4.467099 ],
      "source": "house.mtl"
    },
    {
      "type": "solid",
      "extent": [ -1.731767, -6.329101, 4.504433, 4.467099 ],
      "source": "solid_house.jpg"
    }
  ]
}
```
