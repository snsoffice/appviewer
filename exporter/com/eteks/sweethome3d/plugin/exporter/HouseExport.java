/*
 * HouseExport.java
 *
 * Usage:
 *
 *   java OPTIONS com.eteks.sweethome3d.plugin.exporter.HouseExport --output=PATH --resolution=N NAME.sh3d
 *
 *   --resolution means how many meters of each pixel. For example, resolution=0.02, 1m => 50 pixels
 *
 *   Output files will be saved in the output PATH:
 *
 *     config.json
 *     layers/
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
            // List<Level> levels = home.getLevels();
            // for (int i = 0; i < levels.size(); i++) {
            //     if (levels.get(i).isViewable()) {
            //         levels.get(i).setVisible(true);
            //         System.out.println("Level " + i);
            //     }
            // }

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
        writer.write(String.format("longitude: %f,%nlatitude: %f,%naltitude: %f,%noffset: [%f, %f],%n",
                                   Math.toDegrees(compass.getLongitude()),
                                   Math.toDegrees(compass.getLatitude()),
                                   0f,
                                   compass.getX(),
                                   compass.getY()));
    }

    public static void writeViewData(OutputStreamWriter writer, Home home, Rectangle2D itemBounds,
                                     double resolution, double margin, String path) throws IOException {
        writer.write(String.format("views: {%n"));

        double scale = 1 / resolution / 100;
        double s = margin * resolution;
        writer.write(String.format("plan: {%n" +
                                   "  imageSize: [ %d, %d ],%n" +
                                   "  imageExtent: [ %f, %f, %f, %f ],%n" +
                                   "  url: \"%s/views/plan/plan_house.png\",%n" +
                                   "},%n",
                                   (int)Math.ceil(itemBounds.getWidth() * scale + 2 * margin),
                                   (int)Math.ceil(itemBounds.getHeight() * scale + 2 * margin),
                                   itemBounds.getMinX() / 100 - s,
                                   itemBounds.getMinY() / 100 - s,
                                   itemBounds.getMaxX() / 100 + s,
                                   itemBounds.getMaxY() / 100 + s,
                                   path));

        writer.write(String.format("solid: {%n  url: \"%s/views/solid/house.obj\",%n},%n", path));

        int[] size = PhotoMaker.getImageSize(home, itemBounds, resolution * 2);
        double[] extent = PhotoMaker.getImageExtent(home, itemBounds);
        writer.write(String.format("stereo: {%n" +
                                   "  constrainRotation: 8,%n" +
                                   "  imageSize: [ %d, %d ],%n" +
                                   "  imageExtent: [ %f, %f, %f, %f ],%n" +
                                   "  urlPattern: \"%s/views/stereo/stereo_house%%d.jpg\",%n" +
                                   "}%n",
                                   size[0], size[1],
                                   extent[0], extent[1], extent[2], extent[3],
                                   path));

        writer.write(String.format("},%n"));
    }

    public static void main(String[] args) {

        if ( args.length == -1 ) {
            System.out.println("没有输入文件");
            return;
        }

        float resolution = 0.02f;
        String output = null;
        String filename = null;

        for (String arg: args) {
            if (arg.startsWith("--output", 0))
                output = arg.split("=")[1];
            else if (arg.startsWith("--resolution"))
                resolution = Float.parseFloat(arg.split("=")[1]);
            else
                filename = arg;
        }

        if ( filename == null ) {
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
        System.out.println("输出图片文件的分辨率为 " + resolution);

        //创建目录
        String viewPath = output + File.separator + "views";
        String[] names = {"plan", "solid", "stereo"};
        for (String name: names) {
            File dir = new File(viewPath + File.separator + name);
            if (!dir.exists()) {
                System.out.println("创建目录 " + dir.getAbsoluteFile());
                if (!dir.mkdirs()) {
                    System.out.println("创建目录 " + dir.getName() + "失败");
                    return;
                }
            }
        }

        System.out.println("开始处理输入文件 " + filename + " ...");
        DefaultHomeInputStream in = null;
        Home home = null;
        try {
            File homeFile = new File(filename);
            String homeName = homeFile.getParent();

            // If preferences are not null replace home content by the one in preferences when it's the same
            in = new DefaultHomeInputStream(homeFile, ContentRecording.INCLUDE_ALL_CONTENT, null, null, false);
            home = in.readHome();

            for (HomePieceOfFurniture piece: home.getFurniture())
                System.out.println(piece.getName());
            UserPreferences preferences = new DefaultUserPreferences();
            preferences.setUnit(LengthUnit.METER);

            HomeController controller = new HomeController(home, preferences, new SwingViewFactory());
            HomePane pane = new HomePane(home, preferences, controller);

            // String svgFilename = output + File.separator + "house.svg";
            // System.out.println("输出平面图文件 " + svgFilename);
            // pane.exportToSVG(svgFilename);

            String objFilename = viewPath + File.separator + "solid" + File.separator + "house.obj";
            System.out.println("输出三维模型到 " + objFilename);
            pane.exportToOBJ(objFilename);

            PlanExport plan = new PlanExport(home, preferences);
            float planScale = 1 / resolution / 100;
            String planFilename = viewPath + File.separator + "plan" + File.separator + "plan_house.png";
            String imageType = "PNG";
            System.out.printf("输出缩放比例为 %f 的平面图到 %s%n", planScale, planFilename);
            plan.exportToPNG(planFilename, planScale, imageType);

            String stereoPath = viewPath + File.separator + "stereo";
            Rectangle2D itemBounds = plan.getItemsBounds();
            System.out.printf("输出分辨率为 %f 的立体图到目录 %s%n", resolution * 2, stereoPath);
            imageType = "JPG";
            // PhotoMaker.makeStereoPhotos(home, itemBounds, resolution * 100 * 2, stereoPath, imageType);

            // 输出 config.json
            String jsonFilename = output + File.separator + "config.json";
            FileOutputStream out = new FileOutputStream(jsonFilename);
            OutputStreamWriter writer = new OutputStreamWriter(out);

            System.out.println("输出 JSON 文件 " + jsonFilename);
            writer.write(String.format("{%nname: \"%s\",%n", homeName));
            writeCompassData(writer, home);
            writeViewData(writer, home, itemBounds, resolution, plan.getExtraMargin(), output);
            plan.writeData(writer, output);
            writer.write(String.format("children:[]%n}%n"));
            writer.flush();
            out.close();

        } catch (FileNotFoundException ex) {
            System.out.println("读取输入文件 " + filename + " 失败: " + ex);
        } catch (RecorderException ex) {
            System.out.println("输出失败: " + ex);
        } catch (IOException ex) {
            System.out.println("输出失败: " + ex);
        } catch (ClassNotFoundException ex) {
            System.out.println("输出失败: " + ex);
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
