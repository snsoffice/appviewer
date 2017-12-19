# 数据目录结构和文件格式 #

## 目录结构 ##

组织机构的数据按照下面的目录结构进行存储

```
  organizations/
    NAME/
        config.json
        house.sh3d
        house.csv

        views/
            plan/
            solid/
            stereo/

        features/
            photo/
            panorama/
            page/
```

每一个组织机构有一个唯一的名称，对应一个目录，该目录下面存放该组织结构
的所有文件。

### config.json ###

必须存在，配置文件，一般是根据组织机构的资源使用工具生成，也可以人工编
写。

### house.sh3d ###

可选，组织机构的三维模型文件。

### views/ ###

存放图层资源，一般是组织机构三维模型文件通过工具自动生成。

* plan   平面图
* solid  .obj 格式的三维模型
* stereo 八张立体图，第一张为正北方向，然后依次顺时针旋转45度的立体图

### features/ ###

存放特征资源。

* photo    照片
* panorama 全景照片
* text     文本

## 文件格式 ##

### config.json ###

```
{
    name: "ID",
    longitude: float,
    latitude: float,
    altitude: float,
    origin: [x, y],

    views: {
        plan: {
            imageSize: [width, height],
            imageExtent: [xmin, ymin, xmax, ymax],
            url: "",
        },
        solid: {
            url: "",
        },
        stereo: {
            constrainRotation: 8,
            imageSize: [width, height],
            imageExtent: [xmin, ymin, xmax, ymax],
            urlPattern: "path/stereo_house%d.jpg",
        },
    },

    features: {
        photo: [
            {x, y, z, yaw, url, format}, ...
        ],
        panorama: [
            {x, y, z, yaw, url, format},
        ],
        page: [
            {x, y, z, yaw, url, format},
        ],
    },

    children: [
        {name, longitude, latitude, altitude}, ...
    ]
}
```
