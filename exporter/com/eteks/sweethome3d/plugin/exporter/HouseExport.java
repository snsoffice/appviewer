/*
 * HouseExport.java
 *
 * Usage:
 *
 *   java OPTIONS com.eteks.sweethome3d.plugin.exporter.HouseExport \
 *                --base=PATH --output=PATH \
 *                --resolution=N --stereo-resolution=N \
 *                NAME.sh3d
 *
 *   --base base data path
 *   --output where to save exported files, default is same as input file
 *   --resolution means how many meters of each pixel. For example, resolution=0.02, 1m => 50 pixels
 *   --stereo-resolution used by stereo images, if not set, same as resolution
 *
 *   Output files will be saved in the output PATH:
 *
 *     config.json
 *     views/
 *       plan/plan-NAME.jpg
 *       solid/NAME.mtl, NAME.obj, textures (*.jpeg | *.jpg | *.png)
 *       stereo/stereo-NAME[1-8].jpg
 *
 * In my laptop, OPTIONS is
 *
 *   -Djava.library.path=lib/windows/i386 \
 *   -cp ".;SweetHome3D-5.6.jar;lib/j3dcore.jar;lib/j3dutils.jar;lib/vecmath.jar;lib/sunflow-0.07.3i.jar;exporter.jar"
 *
 * And
 *
 *   String author = System.getProperty("home.author", ""));
 *   String contributor = System.getProperty("home.contributor", ""));
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
// import com.eteks.sweethome3d.swing.FileContentManager;


/**
 * Export home
 * @author Jondy Zhao
 */
public class HouseExport {

    private static String join2(List<String> strs,String splitter) {
        if (strs.size() == 0)
            return "";
        StringBuffer sb = new StringBuffer();
        for(String s:strs){
            sb.append(s+splitter);
        }
        String s = sb.toString();
        return s.substring(0, s.length() - splitter.length());
    }

    public static void test(File homeFile, File outputFile,
                            int width, int height, String imageType,
                            String cameraName, String[] cameraVision)
        throws RecorderException {

        DefaultHomeInputStream in = null;
        Home home;
        try {
            // If preferences are not null replace home content by the one in preferences when it's the same
            in = new DefaultHomeInputStream(homeFile, ContentRecording.INCLUDE_ALL_CONTENT, null, null, false);
            home = in.readHome();

            UserPreferences preferences = new DefaultUserPreferences();
            preferences.setUnit(LengthUnit.METER);
            // ContentManager contentManager = new FileContentManager(preferences);
            // javax.swing.undo.UndoableEditSupport undoSupport;
            HomeController controller = new HomeController(home, preferences, new SwingViewFactory());
            HomePane pane = new HomePane(home, preferences, controller);
            if (pane == null)
                System.out.println("Create HomePane failed");
            else {
                System.out.println("Export to house.svg");
                pane.exportToSVG("house.svg");
                System.out.println("Export to solid/house.obj");
                pane.exportToOBJ("solid/house.obj");
                // controller.exit();
            }

            // PlanController pcontroller = new PlanController(home, preferences, new SwingViewFactory(), new FileContentManager(), null);
            PlanComponent plan = new PlanComponent(home, preferences, null);
            if (plan == null)
                System.out.println("Create PlanComponent failed");
            else {
                home.setSelectedItems(home.getSelectableViewableItems());
                plan.setBackgroundPainted(false);
                BufferedImage img = plan.getClipboardImage();
                if (img == null)
                    System.out.println("getClipboardImage return null");
                else
                    ImageIO.write(img, ImageConstants.PNG, new File("clipboard.png"));
            }
            Camera camera = null;
            List<Camera> cameras = home.getStoredCameras();
            for (int i = 0; i < cameras.size(); i ++)
                if (cameras.get(i).getName().equalsIgnoreCase(cameraName)) {
                    camera = cameras.get(i);
                    break;
                }
            if (camera == null) {
                // if (cameraVision == null)
                //     camera = home.getTopCamera();
                // else {
                //     camera = new Camera(Float.parseFloat(cameraVision[0]),
                //                         Float.parseFloat(cameraVision[1]),
                //                         Float.parseFloat(cameraVision[2]),
                //                         Float.parseFloat(cameraVision[3]),
                //                         Float.parseFloat(cameraVision[4]),
                //                         Float.parseFloat(cameraVision[5]));
                //     camera.setTime(?);
                //     cameraName = "Custom";
                // }
                camera = home.getTopCamera();
                if (cameraVision != null) {
                    // Debug vision: 138.63348,78.55249,1088.331,-84.81423,1.5707964,1.0995575
                    camera.setX(Float.parseFloat(cameraVision[0]));
                    camera.setY(Float.parseFloat(cameraVision[1]));
                    camera.setZ(Float.parseFloat(cameraVision[2]));
                    camera.setYaw(Float.parseFloat(cameraVision[3]));
                    camera.setPitch(Float.parseFloat(cameraVision[4]));
                    camera.setFieldOfView(Float.parseFloat(cameraVision[5]));
                    cameraName = "Custom";
                }
            }
            System.out.println("Use camera: " + (cameraName == null ? "Default" : cameraName));
            System.out.println("Camera at: " + camera.getX() + ", " + camera.getY() + ", " + camera.getZ());
            System.out.println("Camera yaw: " + camera.getYaw());
            System.out.println("Camera pitch: " + camera.getPitch());
            System.out.println("Camera field of view: " + camera.getFieldOfView());
            System.out.println("Camera time: " + camera.getTime());

            System.out.println("Generate image (." + imageType.toLowerCase() + ", " + width + "x" + height + ")...");
            BufferedImage photo = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            PhotoRenderer renderer = new PhotoRenderer(home, PhotoRenderer.Quality.LOW);
            // renderer.render(photo, camera, null);

            System.out.println("Write image to " + outputFile.getName());
            ImageIO.write(photo, imageType, outputFile);

        } catch (InterruptedIOException ex) {
            throw new InterruptedRecorderException("Save home to XML");
        } catch (IOException ex) {
            throw new RecorderException("Couldn't read exported home to XML", ex);
        } catch (ClassNotFoundException ex) {
            // Shouldn't happen
            throw new RecorderException("Couldn't render home to image", ex);
        } finally {
            if (in != null) {
                try {
                    in.close();
                } catch (IOException ex) {
                    ex.printStackTrace();
                }
            }
        }
    }

    public static void writeCompassData(OutputStreamWriter writer, Home home) throws IOException {
        Compass compass = home.getCompass();
        writer.write(String.format("\"longitude\": %f,%n\"latitude\": %f,%n\"altitude\": %f,%n\"origin\": [%f, %f],%n",
                                   Math.toDegrees(compass.getLongitude()),
                                   Math.toDegrees(compass.getLatitude()),
                                   0f,
                                   compass.getX(),
                                   compass.getY()));
    }

    public static void writeViewData(OutputStreamWriter writer, Home home, Rectangle2D itemBounds,
                                     double resolution, double stereoResolution, double margin, String path) throws IOException {
        double m = 2.0;
        writer.write(String.format("\"extent\": [ %f, %f, %f, %f ],%n",
                                   itemBounds.getMinX() / 100 - m,
                                   itemBounds.getMinY() / 100 - m,
                                   itemBounds.getMaxX() / 100 + m,
                                   itemBounds.getMaxY() / 100 + m
                                   ));

        writer.write(String.format("\"views\": {%n"));

        double scale = 1 / resolution / 100;
        double s = margin * resolution;
        writer.write(String.format("\"plan\": {%n" +
                                   "  \"size\": [ %d, %d ],%n" +
                                   "  \"extent\": [ %f, %f, %f, %f ],%n" +
                                   "  \"url\": \"%s/views/plan/plan_house.png\"%n" +
                                   "},%n",
                                   (int)Math.ceil(itemBounds.getWidth() * scale + 2 * margin),
                                   (int)Math.ceil(itemBounds.getHeight() * scale + 2 * margin),
                                   itemBounds.getMinX() / 100 - s,
                                   itemBounds.getMinY() / 100 - s,
                                   itemBounds.getMaxX() / 100 + s,
                                   itemBounds.getMaxY() / 100 + s,
                                   path));

        writer.write(String.format("\"solid\": {%n  \"url\": \"%s/views/solid/house.obj\"%n},%n", path));

        int[] size = PhotoMaker.getImageSize(home, itemBounds, stereoResolution);
        double[] extent = PhotoMaker.getImageExtent(home, itemBounds);
        writer.write(String.format("\"stereo\": {%n" +
                                   "  \"size\": [ %d, %d ],%n" +
                                   "  \"extent\": [ %f, %f, %f, %f ],%n" +
                                   "  \"url\": \"%s/views/stereo/stereo_house.jpg\"%n" +
                                   "},%n",
                                   size[0], size[1],
                                   extent[0], extent[1], extent[2], extent[3],
                                   path));

        Level level = home.getSelectedLevel();
        List<String> labels = new ArrayList<String>();
        for (Label label: home.getLabels()) {
            if ( level == null || label.isAtLevel(level))
                labels.add(String.format("{%n" +
                                         "  \"text\": \"%s\",%n" +
                                         "  \"geometry\": \"POINT (%f %f)\"%n" +
                                         "}", label.getText(), label.getX() / 100, label.getY() / 100));
        }
        writer.write(String.format("\"label\": [%n%s%n]%n", join2(labels, ",\n")));
        writer.write(String.format("},%n"));
    }

    public static void writeElevationData(OutputStreamWriter writer, Home home, List<Level> levels) throws IOException {
        List<String> results = new ArrayList<String>();
        // for (int i = 0; i < levels.size(); i++) {
        //     if (levels.get(i).isViewable())
        //         results.add(String.format("\"floor%d\"", i));
        // }
        for (Level level: levels) {
            if (level.isViewable())
                results.add(String.format("\"%s\"", level.getName()));
        }
        writer.write(String.format("\"elevations\":[ %s ]%n}%n", join2(results, ", ")));
    }

    public static void writeChildren(OutputStreamWriter writer, Home home) throws IOException {
        List<String> results = new ArrayList<String>();        
        Level level = home.getSelectedLevel();
        for (Room room: home.getRooms()) {
            if (level != null && !room.isAtLevel(level))
                continue;
            String title = room.getName();
            if (title == null || title.equals(""))
                continue;
            List<String> pts = new ArrayList<String>();
            for(float[] p: room.getPoints()) {
                pts.add(String.format("%f %f", p[0] / 100, p[1] / 100));
            }
            results.add(String.format("{%n" +
                                      "  \"name\": \"%s\",%n" +
                                      "  \"geometry\": \"POLYGON ((%s))\"%n}",
                                      title, join2(pts, ", ")));
        }
        writer.write(String.format("\"children\": [%n%s%n]%n", join2(results, ",\n")));
    }

    public static Rectangle2D export(Home home, UserPreferences preferences, float resolution, float stereoResolution,
                                     String levelName, String baseUrl, String viewPath, String output)
        throws FileNotFoundException, RecorderException, IOException {

        String[] names = {"plan", "solid", "stereo"};
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

        // String svgFilename = output + File.separator + "house.svg";
        // System.out.println("输出平面图文件 " + svgFilename);
        // pane.exportToSVG(svgFilename);

        String objFilename = viewPath + File.separator + "solid" + File.separator + "house.obj";
        System.out.println("输出三维模型到 " + objFilename);
        pane.exportToOBJ(objFilename);

        PlanExport plan = new PlanExport(home.clone(), preferences);
        float planScale = 1 / resolution / 100;
        String planFilename = viewPath + File.separator + "plan" + File.separator + "plan_house.png";
        String imageType = "PNG";
        System.out.printf("输出缩放比例为 %f 的平面图到 %s%n", planScale, planFilename);
        plan.exportToPNG(planFilename, planScale, imageType);

        String stereoPath = viewPath + File.separator + "stereo";
        Rectangle2D itemBounds = plan.getItemsBounds();
        System.out.printf("输出分辨率为 %f 的立体图到目录 %s%n", stereoResolution, stereoPath);
        imageType = "JPG";
        PhotoMaker.makeStereoPhotos(home, itemBounds, stereoResolution * 100, stereoPath, imageType);

        // 输出 config.json
        String jsonFilename = output + File.separator + "config.json";
        FileOutputStream out = new FileOutputStream(jsonFilename);
        OutputStreamWriter writer = new OutputStreamWriter(out);

        System.out.println("输出 JSON 文件 " + jsonFilename);
        writer.write(String.format("{%n\"name\": \"%s\",%n", levelName));
        writeCompassData(writer, home);
        writeViewData(writer, home, itemBounds, resolution, stereoResolution, plan.getExtraMargin(), baseUrl);
        plan.writeData(writer, baseUrl);
        writeChildren(writer, home); 
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
        float stereoResolution = 0.f;
        String output = null;
        String filename = null;
        String basePath = "";
        String baseUrl = null;
        float originX = 0;
        float originY = 0;

        for (String arg: args) {
            if (arg.startsWith("--output", 0))
                output = arg.split("=")[1];
            else if (arg.startsWith("--resolution"))
                resolution = Float.parseFloat(arg.split("=")[1]);
            else if (arg.startsWith("--stereo-resolution"))
                stereoResolution = Float.parseFloat(arg.split("=")[1]);
            else if (arg.startsWith("--base", 0))
                basePath = arg.split("=")[1];
            else if (arg.startsWith("--originX", 0)) {
                originX = Float.parseFloat(arg.split("=")[1]);
            }
            else if (arg.startsWith("--originY", 0)) {
                originY = Float.parseFloat(arg.split("=")[1]);
            }
            else
                filename = arg;
        }

        if (stereoResolution == 0.f)
            stereoResolution = resolution;

        if (filename == null) {
            System.out.println("没有输入文件");
            return;
        }

        if (output == null) {
            File file = new File(filename);
            output = file.getParent();
            if (output == null)
                output = "";
        }

        if (output.equals("")) {
            System.out.println("输出目录为当前路径");
        }
        else {
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
        }
        baseUrl = (new File(output)).getAbsolutePath().substring((new File(basePath)).getAbsolutePath().length() + 1).replace(File.separator, "/");
        System.out.println("输出图片文件的分辨率为 " + resolution);

        //创建目录
        String viewPath = output + File.separator + "views";

        System.out.println("开始处理输入文件 " + filename + " ...");
        DefaultHomeInputStream in = null;
        Home home = null;
        try {
            File homeFile = new File(filename);
            String homeName = homeFile.getParentFile().getName();

            // If preferences are not null replace home content by the one in preferences when it's the same
            in = new DefaultHomeInputStream(homeFile, ContentRecording.INCLUDE_ALL_CONTENT, null, null, false);
            home = in.readHome();

            UserPreferences preferences = new DefaultUserPreferences();
            preferences.setUnit(LengthUnit.METER);

            Compass compass = home.getCompass();
            compass.setX( originX );
            compass.setY( originY );

            List<Level> levels = home.getLevels();
            if (levels.size() == 0) {
                export(home, preferences, resolution, stereoResolution, homeName, baseUrl, viewPath, output);
            } else {
                Rectangle2D homeBounds = null;
                for (int i = 0; i < levels.size(); i++) {
                    Level level = levels.get(i);
                    if (level.isViewable()) {
                        String levelName = String.format("floor%d", i);
                        String levelTitle = level.getName(); // .replace(" ", "");
                        String levelOutput = output + File.separator + levelName;
                        String levelViewPath = levelOutput + File.separator + "views";
                        String levelBaseUrl = baseUrl + "/" + levelName;
                        level.setVisible(true);
                        home.setSelectedLevel(level);
                        Rectangle2D levelBounds = export(home, preferences, resolution, stereoResolution, levelName, levelBaseUrl, levelViewPath, levelOutput);
                        if ( homeBounds == null )
                            homeBounds = levelBounds;
                        else {
                            Rectangle2D.union(homeBounds, levelBounds, homeBounds);
                        }
                    }
                }
                // 输出 config.json
                String jsonFilename = output + File.separator + "config.json";
                FileOutputStream out = new FileOutputStream(jsonFilename);
                OutputStreamWriter writer = new OutputStreamWriter(out);

                System.out.println("输出 JSON 文件 " + jsonFilename);
                writer.write(String.format("{%n\"name\": \"%s\",%n", homeName));
                writeCompassData(writer, home);
                writer.write(String.format("\"extent\": [ %f, %f, %f, %f ],%n",
                                           homeBounds.getMinX() / 100 - 2,
                                           homeBounds.getMinY() / 100 - 2,
                                           homeBounds.getMaxX() / 100 + 2,
                                           homeBounds.getMaxY() / 100 + 2
                                           ));
                writeElevationData(writer, home, levels);
                writer.flush();
                out.close();
            }

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
