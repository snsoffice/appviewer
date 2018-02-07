# 编译基于 Firefox For Android 的浏览器

## 编译服务器

安装虚拟机 ubuntu-svr

```
    # 启动虚拟机
    vboxmanage startvm ubuntu-svr

    # 连接手机到服务器，查看手机对应的 usb 的 UUID
    sudo -g vboxusers vboxmanage list usbhost

    # 连接手机到虚拟机
    sudo -g vboxusers vboxmanage controlvm ubuntu-svr usbattach XXXX

    # 配置虚拟机
    vboxmanage modifyvm ubuntu-svr --clipboard bidirectional --vram 128M
```

磁盘空间不够，在主机上添加硬盘

``` bash

    vboxmanage createhd --filename "~/VirtualBox VMs/vdisks/ubuntu-svr-android.vdi" --size 20000

    vboxmanage storageattach ubuntu-svr --storagectl "SATA" --port 1 --device 0 --type hdd --medium "~/VirtualBox VMs/vdisks/ubuntu-svr-android.vdi"
```

在虚拟机上增加文件系统

``` bash
    # 查看设备名，例如 /dev/sdb
    sudo fdisk -l

    # 进入 fdisk 界面，操作新硬盘
    sudo fdisk /dev/sdb

    # 使用 p 显示分区信息，使用 d 创建新分区

    # 使用 w 保存退出

    # 格式化，第一个分区为 /dev/sdb1
    sudo mkfs.ext4 /dev/sdb1

    # 挂上分区
    sudo mount /dev/sdb1 /opt/Android

    # 修改 /etc/fstab，增加一行
    /dev/sdb1 /opt/Android ext4 defaults 0 0
```

## 编译 Firefox For Android

Refer to [Simple_Firefox_for_Android_build](https://developer.mozilla.org/en-US/docs/Mozilla/Developer_guide/Build_Instructions/Simple_Firefox_for_Android_build)

在线查看代码 [mozilla-central](https://dxr.mozilla.org/mozilla-central/source/)

下载源码，

```
    hg clone https://hg.mozilla.org/mozilla-central
```

或者下载一个源代码包，这样能快一些。


运行 bootstrap 构建环境

```
    cd mozilla-central
    ./mach bootstrap

    # 清空原来的 gradle 配置
    rm -rf ./objdir-frontend
    ./gradlew clean

```

当出现提示选择编译模式的时候，选择 **3. Firefox for Android Artifact Mode**

这需要很长的时间，从网络上下载很多东西，耐心等待环境构建完成

创建 **mozconfig** 文件

```
# Build Firefox for Android:
ac_add_options --enable-application=mobile/android
ac_add_options --target=arm-linux-androideabi

# With the following Android SDK:
ac_add_options --with-android-sdk=/home/jondy/.mozbuild/android-sdk-linux

# Enable artifact building:
ac_add_options --enable-artifact-builds

# Write build artifacts to:
mk_add_options MOZ_OBJDIR=./objdir-frontend

```

开始编译和打包

```
    ./mach build
    ./mach package

    # 在手机上运行
    ./mach run
```


## 改造成为远景网专用浏览器

package name: org.snsoffice.future_sky
display name: Future Sky (远景网)

## 输出 apk 名称

参考文件 **mozilla-central/toolkit/mozapps/installer/package-name.mk**

MOZ_SIMPLE_PACKAGE_NAME=future-sky-0.1a1

## branding

修改这个目录下面的文件 **mozilla-central/mobile/android/branding/unofficial**

* configure.sh

```
ANDROID_PACKAGE_NAME=org.snsoffice.future_sky
MOZ_APP_DISPLAYNAME="Future Sky"
MOZ_APP_BASENAME=Future
MOZ_APP_VENDOR=SnsOffice
MOZ_APP_NAME=future-sky
MOZ_APP_VERSION=0.1a1
MOZ_APP_UA_NAME=Future

MOZ_UPDATER=
MOZ_ANDROID_ANR_REPORTER=
MOZ_DATA_REPORTING=
MOZ_CRASHREPORTER=
MOZ_SERVICES_HEALTHREPORT=
MOZ_TELEMETRY_ON_BY_DEFAULT=
MOZ_TELEMETRY_REPORTING=
MOZ_ANDROID_GCM_SENDERID=965234145045
MOZ_MMA_GCM_SENDERID=242693410970

```

## 替换 res/

图标设计参考 https://material.io/guidelines/style/icons.html

* mhdpi 48 large 96
* hdpi 72  large 144
* xhdpi 96 large 192
* nodpi firstrun_welcome.png 720x540

## 替换 content/

* about.png 258x94
* favicon32.png
* favicon64.png

## 替换 locales/en-US

```
# File: brand.dtd
<!ENTITY  brandShortName  "Future">
<!ENTITY  brandFullName   "Future Sky">
<!ENTITY  vendorShortName "SnsOffice">

# File: brand.properties
brandShortName=Future
brandFullName=Future Sky

```

## 新建 locales/zh-CN

这个不起作用，参考  mozilla-central/mobile/android/base/locales/Makefile.in line 13
所以就不需要添加了，需要的话可以直接 mobile/android/app/src/main/res/values-zh/strings.xml

```
# File: brand.dtd
<!ENTITY  brandShortName  "远景网">
<!ENTITY  brandFullName   "远景网 天空版">
<!ENTITY  vendorShortName "Snsoffice">

<!ENTITY  brandPocket     "Pocket">

# File: brand.properties
brandShortName=远景网
brandFullName=远景网 天空版
```

## 修改 Java 文件

``` java

    //
    // mobile/android/base/java/org/mozilla/gecko/BrowserApp.java
    //

    // 隐藏 Chrome 地址栏，设置高度为 0: onCreate

        // Jondy: hide chrome toolbar
        mBrowserChrome.getLayoutParams().height = 0;

    // 同时返回 null 在 public Bitmap getBitmapOfToolbarChrome()

    // Jondy: hide chrome toolbar
    if (!mBrowserChrome.getHeight())
        return null;

    // 不显示 firstrun , 注释下面的语句
    // checkFirstrun(this, intent);
    // 或者使用 GuestMode ?

    // 暂时不显示 Feedback

                    if (launchCount == FEEDBACK_LAUNCH_COUNT) {
                        // Jondy: no feedback now
                        // EventDispatcher.getInstance().dispatch("Feedback:Show", null);
                    }


    // 以下内容现在并没有修改，为以后需要的时候的提供参考
    //

    // line 853 注释掉，这样就不会打开 about:home，结果是无效
    // setBrowserToolbarListeners();

    // line 1258 之前，这个出现的太晚了

        // Jondy: new a future tab
        else if (!queuedTabCount) {
            ThreadUtils.postToUiThread(new Runnable() {
                @Override
                public void run() {
                    Tabs.getInstance().loadUrl("chrome://browser/content/aboutFuture.xhtml", Tabs.LOADURL_USER_ENTERED);
                    showNormalTabs();
                }
            });
        }

    // 打开一个 tab
    Tabs.getInstance().loadUrl("chrome://browser/content/aboutFuture.xhtml", Tabs.LOADURL_USER_ENTERED);

    ThreadUtils.postToUiThread(new Runnable() {
                @Override
                public void run() {
                    showNormalTabs();
                }
            });

    //
    // 注释 1070 行，每次都显示 firstrun
    // prefs.edit().putBoolean(FirstrunAnimationContainer.PREF_FIRSTRUN_ENABLED, false).apply();

    // 使用自定义 firstrun
    // 复制 mobile/android/base/java/org/mozilla/gecko/firstrun/RestrictedWelcomePanel.java
    // 为  FutureWelcomePanel.java
    // mobile/android/base/moz.build 添加一行
        'firstrun/RestrictedWelcomePanel.java',
        'firstrun/FutureWelcomePanel.java',
    //  mobile/android/base/java/org/mozilla/gecko/firstrun/FirstrunPagerConfig.java
    //  增加函数
        public static List<FirstrunPanelConfig> getFuture() {
            final List<FirstrunPanelConfig> panels = new LinkedList<>();
            panels.add(new FirstrunPanelConfig(FutureWelcomePanel.class.getName(), FutureWelcomePanel.TITLE_RES));
            return panels;
        }

    // FirstrunPager.java!load，返回的 panels
    panels = FirstrunPagerConfig.getFuture();


    // 自定义推荐网站
    final SuggestedSites suggestedSites = new SuggestedSites(appContext, distribution);
    final BrowserDB db = BrowserDB.from(profile);
    db.setSuggestedSites(suggestedSites);

    // 设置 TopSites: mobile/locales/en-US/chrome/region.properties

    // 定制 splash screen
    //  mobile/android/app/src/main/res/layout/splash_screen.xml
    //  mobile/android/base/org/mozilla/gecko/widget/SplashScreen.java

```
## 修改 用户配置 文件

修改 **mozilla-central/mobile/android/app/mobile.js** 增加

```
    // 默认首页 PREFS_HOMEPAGE
    // "chrome://browser/content/aboutFuture.xhtml"
    pref("android.not_a_preference.homepage", "http://192.168.121.103:9090/demos/");

    // 新建标签默认页面是否装入主页 PREFS_HOMEPAGE_FOR_EVERY_NEW_TAB
    // pref("android.not_a_preference.newtab.load_homepage", true);

    // 不启动 firstrun，好像都不起作用
    // pref("android.not_a_preference.startpane_enabled", false);
    // pref("telemetry-isFirstRun", false);

    // 摄像头权限和话筒，好像不起作用，设置为 false 也会出现提示对话框
    // Ask for permission when enumerating WebRTC devices.
    pref("media.navigator.permission.device", true);

```

## 中文支持

* 创建中文

```
    ./mach build merge-zh-CN

    # 或者执行下面的命令
    ./mach build chrome-zh-CN

```

这个命令隐含会下载 https://hg.mozilla.org/l10n-central/zh-CN 到 ~/.mozbuild/l10n-central/zh-CN

* 创建中文 values-zh/strings.xml

    拷贝文件 **objdir-frontend/mobile/android/base/res/values-zh-rCN/strings.xml** 到

    **mobile/android/app/src/main/res/values-zh**

    修改其中的 "moz_app_displayname" 为中文 "远景网"

    通过 Android Studio 添加 values-zh/strings.xml

* 设置首选项指定中文，默认设置是根据系统语言来自动选择

```
    intl.locale.matchOS false
    intl.locale.requested zh-CN
    general.useragent.locale zh-CN  (Before firefox 59)

```

* chrome 中文

参考 https://dxr.mozilla.org/mozilla-central/source/build/docs/locales.rst

```
    mobile/android/locales
    mobile/locales

```

要在这个里面增加一行 mozilla-central/mobile/android/installer/package-manifest.in

```
[mobile]
@BINPATH@/chrome/zh-CN@JAREXT@
@BINPATH@/chrome/zh-CN.manifest
```



``` bash

    # 目前目录使用 @AB_CD@/locale/@AB_CD@/ 的格式
    mkdir -p mobile/android/chrome/locale/zh-CN/overrides

    # 拷贝相关的中文文件，这两部分都是通过下面的命令直接或者间接得到
    # ./mach build chrome-zh-CN
    cp -a ~/.mozbuild/l10n-central/zh-CN/mobile/android/chrome mobile/android/chrome/locale/zh-CN
    cp -a objdir-frontend/dist/bin/chrome/zh-CN/locale/zh-CN/browser/searchplugins mobile/android/chrome/locale/zh-CN

    # 拷贝 overrides 文件，首先生成需要拷贝文件的脚本
    gawk -f lang.awk mobile/android/chrome/jar.mn > mobile/android/chrome/locale/collect.sh
    cd mobile/android/chrome/locale/zh-CN/overrides
    bash ../../collect.sh

    # 有两个重复文件，打包的时候会报错，增加两行注释，使之不同
    mobile/android/chrome/locale/zh-CN/browser/overrides/intl.properties
    mobile/android/chrome/locale/zh-CN/browser/overrides/global.dtd

    # searchplugins 下面也有重复文件 bing.xml google*.xml 共四个
    # 把里面的名称修改为中文

```

修改  **mozilla-central/mobile/android/chrome/moz.build**, 增加一个目录

```
with Files('locale/**'):
    BUG_COMPONENT = ('Firefox for Android', 'Locale zh-CN)

DIRS += ['geckoview', 'locale‘]
```

增加文件 **mozilla-central/mobile/android/chrome/zh-CN/moz.build**


```
# -*- Mode: python; indent-tabs-mode: nil; tab-width: 40 -*-
# vim: set filetype=python:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

JAR_MANIFESTS += ['jar.mn']
```

增加文件 **mozilla-central/mobile/android/chrome/zh-CN/jar.mn**

```
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

zh-CN.jar:
% locale browser zh-CN %locale/zh-CN/browser/
  locale/zh-CN/browser/                        (zh-CN/chrome/*.dtd)
  locale/zh-CN/browser/                        (zh-CN/chrome/*.properties)
  locale/zh-CN/browser/overrides               (zh-CN/overrides/*.dtd)
  locale/zh-CN/browser/overrides               (zh-CN/overrides/*.properties)
  locale/zh-CN/browser/overrides/dom           (zh-CN/overrides/dom/*.properties)
  locale/zh-CN/browser/overrides/global        (zh-CN/overrides/global/*.dtd)
  locale/zh-CN/browser/overrides/global        (zh-CN/overrides/global/*.properties)
  locale/zh-CN/browser/overrides/plugins       (zh-CN/overrides/plugins/*.dtd)
  locale/zh-CN/browser/overrides/search        (zh-CN/overrides/search/*.properties)
  locale/zh-CN/browser/overrides/crashreporter (zh-CN/overrides/crashreporter/*.dtd)
  locale/zh-CN/browser/overrides/crashreporter (zh-CN/overrides/crashreporter/*.properties)

  locale/zh-CN/browser/searchplugins           (zh-CN/searchplugins/*.json)
  locale/zh-CN/browser/searchplugins           (zh-CN/searchplugins/*.xml)

```
jar.mn 格式参考： https://dxr.mozilla.org/mozilla-central/source/build/docs/jar-manifests.rst

lang.awk, 用于生成需要打包的中文文件

``` awk
    $ cat lang.awk
    # Usage:
    #
    #   gawk -f lang.awk mobile/android/locales/jar.mn > ~/collect.sh
    #
    #   cd mobile/android/chrome/locales/zh-CN/chrome
    #   mkdir overrides
    #   cd overrides
    #   bash ~/collect.sh

    BEGIN {
      print "src=~/.mozbuild/l10n-central/zh-CN"
      print
    }

    /^% override chrome:\/\/.* chrome:\/\/browser\/locale\/overrides\/.*/ {
      split($4, names, "/")
      n = length(names)
      filename = names[n]
      path = "."
      for (i=6; i<n; i++)
        path = path "/" names[i]
      if (path != ".")
        print "[[ -f " path " ]] || mkdir -p " path
      print "find $src -name " filename " -exec cp {} " path " \\;"
    }

```


## 自定义扩展

创建一个插件，参考

* https://developer.mozilla.org/en-US/docs/Mozilla/Firefox_for_Android
* https://wiki.mozilla.org/Mobile/Fennec/Android

自动发布，打包的时候在根目录下面增加 **distribution/extensions**

参考 https://developer.mozilla.org/en-US/docs/Mozilla/Developer_guide/Customizing_Firefox

## 添加 about:PAGE

修改 ** mobile/android/components/AboutRedirector.js**，增加（似乎无效，
访问 about:futuresky 没有反应）

```
futuresky: {
    uri: "chrome://browser/content/aboutFuture.xhtml",
    privileged: true,
    hide: true
  },

```

同时修改 **mobile/android/chrome/jar.mn**，增加

```
# Jondy: about future page
  content/aboutFuture.xhtml                  (content/aboutFuture.xhtml)
  content/aboutFuture.js                     (content/aboutFuture.js)

```

访问地址 **chrome://browser/content/aboutFuture.xhtml** 或者 **about:futuresky**


## 自定义 HomePanel

访问 about:home?panel=UUID

创建参考 https://developer.mozilla.org/en-US/docs/Archive/Add-ons/Legacy_Firefox_for_Android/API/Home.jsm/panels

## 签名 APK

参考 https://developer.android.google.cn/studio/publish/app-signing.html

## 构建

```
    ./mach build
    ./mach package
    ./mach run
```

## 调试

运行之后查看日志输出

```
    /opt/Android/Sdk/platform-tools/adb logcat | grep -E \(GeckoBrowser\|GeckoApp\|GeckoTab\)
```
