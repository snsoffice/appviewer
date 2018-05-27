/*
 * SimpleHouseExport.java
 *
 * 使用方法:
 *
 *   java OPTIONS com.eteks.sweethome3d.plugin.exporter.SimpleHouseExport \
 *                --base=PATH --output=PATH \
 *                --resolution=N --stereo-resolution=N \
 *                NAME.sh3d
 *
 *   --output 输出文件的路径
 *   --resolution 比例尺，每一个像素代表的长度。例如 resolution=0.02 意思 1 个像素代码 0.02 米
 *
 *   输出一个压缩文件: NAME.zip，其内容如下
 *
 *     config.json
 *     views/
 *       plan/plan-house.jpg
 *       three/NAME.mtl, NAME.obj, textures (*.jpeg | *.jpg | *.png)
 *       solid/solid-house.jpg
 *
 * 辅助选项，如果是作为插件使用，则不需要设置下面的选项，主要是为了导入需要的库
 *
 *   -Djava.library.path=lib/windows/i386 \
 *   -cp ".;SweetHome3D-5.6.jar;lib/j3dcore.jar;lib/j3dutils.jar;lib/vecmath.jar;lib/sunflow-0.07.3i.jar;exporter.jar"
 *
 *
 */
package com.eteks.sweethome3d.plugin.exporter;

import java.awt.Dimension;
import java.awt.geom.Rectangle2D;
import java.awt.image.BufferedImage;

import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.io.InterruptedIOException;

import java.io.BufferedInputStream;
import java.util.Enumeration;
import java.util.zip.CRC32;
import java.util.zip.CheckedOutputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import java.util.zip.ZipOutputStream;

import java.util.ArrayList;
import java.util.List;

import javax.imageio.ImageIO;

import org.freehep.util.UserProperties;
import org.freehep.graphics2d.PixelGraphics2D;
import org.freehep.graphicsio.ImageConstants;
import org.freehep.graphicsio.ImageGraphics2D;
import org.freehep.graphicsio.svg.SVGGraphics2D;

import com.eteks.sweethome3d.io.ContentRecording;
import com.eteks.sweethome3d.io.DefaultHomeInputStream;
import com.eteks.sweethome3d.io.DefaultUserPreferences;
import com.eteks.sweethome3d.j3d.PhotoRenderer;
import com.eteks.sweethome3d.model.Compass;
import com.eteks.sweethome3d.model.Camera;
import com.eteks.sweethome3d.model.Home;
import com.eteks.sweethome3d.model.HomeApplication;
import com.eteks.sweethome3d.model.HomeEnvironment;
import com.eteks.sweethome3d.model.HomeRecorder;
import com.eteks.sweethome3d.model.HomePieceOfFurniture;
import com.eteks.sweethome3d.model.InterruptedRecorderException;
import com.eteks.sweethome3d.model.Label;
import com.eteks.sweethome3d.model.LengthUnit;
import com.eteks.sweethome3d.model.Level;
import com.eteks.sweethome3d.model.RecorderException;
import com.eteks.sweethome3d.model.Room;
import com.eteks.sweethome3d.model.Selectable;
import com.eteks.sweethome3d.model.UserPreferences;
import com.eteks.sweethome3d.swing.HomePane;
import com.eteks.sweethome3d.swing.PlanComponent;
import com.eteks.sweethome3d.swing.SwingViewFactory;
import com.eteks.sweethome3d.tools.OperatingSystem;
import com.eteks.sweethome3d.viewcontroller.HomeController;
import com.eteks.sweethome3d.viewcontroller.PlanController;

/**
 * 根据模型生成远景网地图需要的资源文件
 * @author Jondy Zhao
 */
public class SimpleHouseExport {

    /**
     * 使用分隔符连接数组成为一个字符串
     * @param strs 数组
     * @param splitter 分隔符
     * @return
     */
    private static String join2(List<String> strs, String splitter) {
        if (strs.size() == 0)
            return "";

        StringBuffer sb = new StringBuffer();
        for(String s:strs){
            sb.append(s+splitter);
        }

        String s = sb.toString();
        return s.substring(0, s.length() - splitter.length());
    }

    /**
     * 递归压缩文件夹
     * @param srcRootDir 压缩文件夹根目录的子路径
     * @param file 当前递归压缩的文件或目录对象
     * @param zos 压缩文件存储对象
     * @throws Exception
     */
    private static void zip(String srcRootDir, File file, ZipOutputStream zos) 
        throws Exception {

        if (file == null)
            return;

        //如果是文件，则直接压缩该文件
        if (file.isFile()) {
            int count, bufferLen = 1024;
            byte data[] = new byte[bufferLen];

            //获取文件相对于压缩文件夹根目录的子路径
            String subPath = file.getAbsolutePath();
            int index = subPath.indexOf(srcRootDir);
            if (index != -1) {
                subPath = subPath.substring(srcRootDir.length() + File.separator.length());
            }
            ZipEntry entry = new ZipEntry(subPath);
            zos.putNextEntry(entry);
            BufferedInputStream bis = new BufferedInputStream(new FileInputStream(file));
            while ((count = bis.read(data, 0, bufferLen)) != -1) {
                zos.write(data, 0, count);
            }
            bis.close();
            zos.closeEntry();
        }
        //如果是目录，则压缩整个目录
        else {
            //压缩目录中的文件或子目录
            File[] childFileList = file.listFiles();
            for (int n=0; n<childFileList.length; n++) {
                childFileList[n].getAbsolutePath().indexOf(file.getAbsolutePath());
                zip(srcRootDir, childFileList[n], zos);
            }
        }
    }

    /**
     * 对文件或文件目录进行压缩
     * @param srcPath 要压缩的源文件路径。如果压缩一个文件，则为该文件的全路径；如果压缩一个目录，则为该目录的顶层目录路径
     * @param zipPath 压缩文件保存的路径。注意：zipPath不能是srcPath路径下的子文件夹
     * @param zipFileName 压缩文件名
     * @throws Exception
     */
    public static void zip(String srcPath, String zipPath, String zipFileName) throws Exception {
        CheckedOutputStream cos = null;
        ZipOutputStream zos = null;
        try {
            File srcFile = new File(srcPath);

            //判断压缩文件保存的路径是否存在，如果不存在，则创建目录
            File zipDir = new File(zipPath);
            if (!zipDir.exists() || !zipDir.isDirectory()) {
                zipDir.mkdirs();
            }

            //创建压缩文件保存的文件对象
            String zipFilePath = zipPath + File.separator + zipFileName;
            File zipFile = new File(zipFilePath);
            if (zipFile.exists()) {
                //检测文件是否允许删除，如果不允许删除，将会抛出SecurityException
                SecurityManager securityManager = new SecurityManager();
                securityManager.checkDelete(zipFilePath);
                //删除已存在的目标文件
                zipFile.delete();
            }

            cos = new CheckedOutputStream(new FileOutputStream(zipFile), new CRC32());
            zos = new ZipOutputStream(cos);

            //如果只是压缩一个文件，则需要截取该文件的父目录
            String srcRootDir = srcPath;
            if (srcFile.isFile()) {
                int index = srcPath.lastIndexOf(File.separator);
                if (index != -1) {
                    srcRootDir = srcPath.substring(0, index);
                }
            }
            else
                srcRootDir = srcFile.getAbsolutePath();
            //调用递归压缩方法进行目录或文件压缩
            zip(srcRootDir, srcFile, zos);
            zos.flush();
        }
        catch (Exception e) {
            throw e;
        }
        finally {
            try {
                if (zos != null) {
                    zos.close();
                }
            }
            catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    public static void writeViewData(OutputStreamWriter writer, Home home, Rectangle2D itemBounds) throws IOException {

        final String indent = "  ";
        final String indent2 = "    ";
        final String indent3 = "      ";

        double x0 = itemBounds.getMinX() / 100,
            y0 = -itemBounds.getMaxY() / 100,
            x1 = itemBounds.getMaxX() / 100,
            y1 = -itemBounds.getMinY() / 100;

        writer.write(String.format("%s\"views\":%n%s[%n", indent, indent));

        writer.write(String.format("%s{%n%s\"type\": \"plan\",%n" +
                                   "%s\"extent\": [ %f, %f, %f, %f ],%n" +
                                   "%s\"source\": \"plan_house.png\"%n" +
                                   "%s},%n",
                                   indent2, indent3, indent3,
                                   x0, y0, x1, y1,
                                   indent3, indent2));

        writer.write(String.format("%s{%n%s\"type\": \"solid\",%n" +
                                   "%s\"extent\": [ %f, %f, %f, %f ],%n" +
                                   "%s\"source\": \"solid_house.png\"%n" +
                                   "%s},%n",
                                   indent2, indent3, indent3,
                                   x0, y0, x1, y1,
                                   indent3, indent2));

        writer.write(String.format("%s{%n%s\"type\": \"three\",%n" +
                                   "%s\"extent\": [ %f, %f, %f, %f ],%n" +
                                   "%s\"source\": \"three_house.mtl\"%n" +
                                   "%s}%n",
                                   indent2, indent3, indent3,
                                   x0, y0, x1, y1,
                                   indent3, indent2));

        writer.write(String.format("%s]%n", indent));
    }


    public static void writeRoomData(OutputStreamWriter writer, Home home) throws IOException {
        float area = 0.f;
        List<String> results = new ArrayList<String>();
        for (Room room: home.getRooms()) {
            area += room.getArea();
            List<String> pts = new ArrayList<String>();
            for(float[] p: room.getPoints()) {
                pts.add(String.format("[%f, %f]", p[0] / 100, -p[1] / 100));
            }
            results.add(String.format("[%s]", join2(pts, ", ")));
        }
        writer.write(String.format("  \"area\": %f,%n", area / 10000));
        writer.write(String.format("  \"points\": [%s],%n", join2(results, ", ")));
    }

    public static Rectangle2D export(Home home, UserPreferences preferences,
                                     float resolution, float solidResolution,
                                     String viewPath, String output)
        throws FileNotFoundException, RecorderException, IOException {

        String[] names = {"plan", "solid", "three"};
        for (String name: names) {
            File dir = new File(viewPath + File.separator + name);
            if (!dir.exists()) {
                System.out.println("创建目录 " + dir.getAbsoluteFile());
                if (!dir.mkdirs()) {
                    System.out.println("创建目录 " + dir.getName() + "失败");
                    throw new IOException("创建目录失败");
                }
            }
        }

        HomeController controller = new HomeController(home, preferences, new SwingViewFactory());
        HomePane pane = new HomePane(home, preferences, controller);

        String objFilename = viewPath + File.separator + "three" + File.separator + "three_house.obj";
        System.out.println("输出三维模型到 " + objFilename);
        pane.exportToOBJ(objFilename);

        PlanExport plan = new PlanExport(home.clone(), preferences);
        float planScale = 1 / resolution / 100;
        String planFilename = viewPath + File.separator + "plan" + File.separator + "plan_house.png";
        String imageType = "PNG";
        System.out.printf("输出缩放比例为 %f 的平面图到 %s%n", planScale, planFilename);
        plan.exportToPNG(planFilename, planScale, imageType);

        String solidPath = viewPath + File.separator + "solid";
        Rectangle2D itemBounds = plan.getItemsBounds();
        System.out.printf("输出分辨率为 %f 的立体图到目录 %s%n", solidResolution, solidPath);
        imageType = "JPG";
        PhotoMaker.makeStereoPhotos(home, itemBounds, solidResolution * 100, solidPath, imageType);

        // 输出 config.json
        String jsonFilename = output + File.separator + "config.json";
        FileOutputStream out = new FileOutputStream(jsonFilename);
        OutputStreamWriter writer = new OutputStreamWriter(out);

        System.out.println("输出 JSON 文件 " + jsonFilename);
        writer.write(String.format("{%n  \"name\": \"%s\",%n", home.getName()));
        writeRoomData(writer, home);
        writeViewData(writer, home, itemBounds);
        writer.write(String.format("}%n"));
        writer.flush();
        out.close();

        return itemBounds;
    }

    public static void main(String[] args) {

        if ( args.length == -1 ) {
            System.out.println("没有输入文件");
            return;
        }

        float resolution = 0.02f;
        float solidResolution = 0.02f;
        String output = "tmp";
        String filename = null;

        for (String arg: args) {
            filename = arg;
        }

        File dir = new File(output);
        if (dir.exists()) {
            System.out.println("输出目录为 " + output);
        } else {
            if (dir.mkdirs()) {
                System.out.println("创建输出目录 " + output);
            } else {
                System.out.println("创建输出目录 " + output + " 失败");
                return;
            }
        }

        System.out.println("输出图片文件的分辨率为 " + resolution);

        //创建目录
        String viewPath = output + File.separator + "views";

        System.out.println("开始处理输入文件 " + filename + " ...");
        DefaultHomeInputStream in = null;
        Home home = null;
        try {
            File homeFile = new File(filename);

            // If preferences are not null replace home content by the one in preferences when it's the same
            in = new DefaultHomeInputStream(homeFile, ContentRecording.INCLUDE_ALL_CONTENT, null, null, false);
            home = in.readHome();

            UserPreferences preferences = new DefaultUserPreferences();
            preferences.setUnit(LengthUnit.METER);

            export(home, preferences, resolution, solidResolution, viewPath, output);

            System.out.println("正在生成压缩文件 " + "house.zip" + " ...");
            zip(output, ".", "house.zip");

            System.out.println("删除临时目录 tmp ...");

        } catch (FileNotFoundException ex) {
            System.out.println("读取输入文件 " + filename + " 失败: " + ex);
        } catch (RecorderException ex) {
            System.out.println("输出失败: " + ex);
        } catch (IOException ex) {
            System.out.println("输出失败: " + ex);
        } catch (ClassNotFoundException ex) {
            System.out.println("输出失败: " + ex);
        } catch (Exception ex) {
            System.out.println("未知错误: " + ex);
            ex.printStackTrace();
        } finally {
            if (in != null) {
                try {
                    in.close();
                } catch (IOException ex) {
                    ex.printStackTrace();
                }
            }
            System.out.println("输出结束.");
            System.exit(0);
        }
    }
}
