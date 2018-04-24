/*
 * PhotoMaker.java
 *
 * SweetHome3D 中平面图坐标系是向右为 X 轴，向下为 Y 轴，向上为 Z 轴，是左手系
 *
 * camera 参数说明:
 *
 *   x, y 为房屋的中间位置，z 是距离地面的高度
 *
 *   yaw 是相机偏航角度，也是水平方位角，以 Y 轴正向为 0 度，绕 Z 轴 转圈，顺时针为正，逆时针为负，例如 相机面向负 X 轴为 90 度，面向 X 轴为 -90 度
 *
 *   pitch 是相机仰角，以 Y 轴正向为 0 度，绕 X 轴向下为正，向上为负。
 *
 *   fov 是相机镜头的角度
 *
 *       this.topCamera = new Camera(50, 1050, 1010,
 *       (float)Math.PI, (float)Math.PI / 4, (float)Math.PI * 63 / 180);
 *
 *   time: 1509814800689  => 2017-11-04 PM 5:00 室内有灯光，也不太暗
 */
package com.eteks.sweethome3d.plugin.exporter;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.Rectangle;

import java.awt.geom.AffineTransform;
import java.awt.geom.PathIterator;
import java.awt.geom.Rectangle2D;
import java.awt.geom.Point2D;
import java.awt.image.AffineTransformOp;
import java.awt.image.BufferedImage;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.io.InterruptedIOException;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import javax.imageio.ImageIO;

import com.eteks.sweethome3d.io.ContentRecording;
import com.eteks.sweethome3d.io.DefaultHomeInputStream;
import com.eteks.sweethome3d.model.HomeRecorder;
import com.eteks.sweethome3d.model.HomePieceOfFurniture;
import com.eteks.sweethome3d.model.Home;
import com.eteks.sweethome3d.model.HomeEnvironment;
import com.eteks.sweethome3d.model.Room;
import com.eteks.sweethome3d.model.Compass;
import com.eteks.sweethome3d.model.Camera;
import com.eteks.sweethome3d.model.InterruptedRecorderException;
import com.eteks.sweethome3d.model.Level;
import com.eteks.sweethome3d.model.RecorderException;
import com.eteks.sweethome3d.model.Selectable;
import com.eteks.sweethome3d.model.UserPreferences;
import com.eteks.sweethome3d.tools.OperatingSystem;

import com.eteks.sweethome3d.j3d.PhotoRenderer;


/**
 * Export home to image.
 * @author Jondy Zhao
 */
public class PhotoMaker {


    /**
     * 旋转图片
     * @author Jondy Zhao
     */
    public static BufferedImage postImage(BufferedImage input, double rotation,
                                          int width, int height, int imageType) {

        BufferedImage output = new BufferedImage(width, height, imageType);
        AffineTransform at = new AffineTransform();
        at.rotate(rotation, width / 2, height / 2);
        at.translate((width - input.getWidth()) / 2, (height - input.getHeight()) / 2);
        AffineTransformOp op = new AffineTransformOp(at, AffineTransformOp.TYPE_BICUBIC);
        op.filter(input, output);
        return output;
    }

    /**
     * 旋转图片
     * @author Jondy Zhao
     */
    public static BufferedImage rotateImage(BufferedImage input, double rotation,
                                            int width, int height, int imageType) {

        BufferedImage output = new BufferedImage(width, height, imageType);
        Graphics2D g2d = output.createGraphics();
        // g2d.rotate(-rotation, width / 2, height / 2);
        // g2d.drawImage(input, null, 0, 0);
        AffineTransform at = new AffineTransform();
        at.rotate(rotation, width / 2, height / 2);
        at.translate((width - input.getWidth()) / 2, (height - input.getHeight()) / 2);
        AffineTransformOp op = new AffineTransformOp(at, AffineTransformOp.TYPE_BICUBIC);
        g2d.drawImage(input, op, 0, 0);
        return output;
    }

    /**
     * 计算相机高度，使之正好能把整个房屋拍下。
     * @author Jondy Zhao
     */
    public static double calculateCameraElevation(Rectangle2D itemBounds, double fov) {
        return Math.max(itemBounds.getWidth(), itemBounds.getHeight()) / 2 / Math.tan(fov / 2);
    }

    public static double[] getImageExtent(Home home, Rectangle2D itemBounds) {
        double fov = Math.PI / 180 * 63;
        double s = home.getWallHeight() * Math.tan(fov / 2);
        double[] extent = new double[4];
        extent[0] = (itemBounds.getMinX() - s) / 100;
        extent[1] = (itemBounds.getMinY() - s) / 100;
        extent[2] = (itemBounds.getMaxX() + s) / 100;
        extent[3] = (itemBounds.getMaxY() + s) / 100;
        return extent;
    }

    public static int[] getImageSize(Home home, Rectangle2D itemBounds, double resolution) {
        int[] size = new int[2];
        double[] extent = getImageExtent(home, itemBounds);
        size[0] = (int)((extent[2] - extent[0]) / resolution);
        size[1] = (int)((extent[3] - extent[1]) / resolution);
        return size;
    }

    public static BufferedImage makePhoto(Home home, Camera camera, int itype,
                                 int width, int height) throws IOException {
        BufferedImage photo = new BufferedImage(width, height, itype);
        PhotoRenderer renderer = new PhotoRenderer(home, PhotoRenderer.Quality.HIGH);
        renderer.render(photo, camera, null);
        return photo;
    }

    /**
     * itemBounds 的单位为 米
     *
     * resolution 是每个像素的所代表的长度（米），例如 0.02 表示每个像
     * 素代表 0.02 米，所以 1米需要 50 个像素
     *
     */
    public static void makeStereoPhotos(Home home, Rectangle2D itemBounds, double resolution,
                                        String path, String imageType) throws IOException {
        // int constrainRotation = 8;
        int constrainRotation = 1;
        double pitch = Math.PI / 2;
        double fov = Math.PI / 180 * 63;
        int margin = (int)(home.getWallHeight() * Math.tan(fov / 2) / resolution );
        int itype = imageType.equalsIgnoreCase("PNG") ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;

        double cx = itemBounds.getCenterX();
        double cy = itemBounds.getCenterY();
        double cz = calculateCameraElevation(itemBounds, fov);

        Camera camera = home.getTopCamera();
        camera.setX((float)cx);
        camera.setY((float)cy);
        camera.setZ((float)cz);
        camera.setYaw((float)Math.PI); // 默认上方为北
        camera.setPitch((float)pitch);
        camera.setFieldOfView((float)fov);

        // 根据 resolution 和 margin 转换为像素坐标
        int x0 = (int)(itemBounds.getMinX() / resolution) - margin;
        int y0 = (int)(itemBounds.getMinY() / resolution) - margin;
        int x1 = (int)(itemBounds.getMaxX() / resolution) + margin;
        int y1 = (int)(itemBounds.getMaxY() / resolution) + margin;
        Rectangle itemRect = new Rectangle(x0, y0, x1 - x0, y1 - y0);
        int width = itemRect.width;
        int height = itemRect.height;

        PhotoRenderer renderer = new PhotoRenderer(home, PhotoRenderer.Quality.HIGH);
        // PhotoRenderer renderer = new PhotoRenderer(home, PhotoRenderer.Quality.LOW);
        for (int n = 0; n < constrainRotation ; n ++ ) {
            double rotation = - Math.PI * n / 4;

            AffineTransform transform = new AffineTransform();
            transform.rotate(rotation, cx, cy);

            Rectangle rotRect = new Rectangle(0, 0, -1, -1);
            for (PathIterator it = itemRect.getPathIterator(transform); !it.isDone(); it.next()) {
                float [] pathPoint = new float[2];
                switch (it.currentSegment(pathPoint)) {
                case PathIterator.SEG_LINETO:
                    rotRect.add(pathPoint[0], pathPoint[1]);
                    break;
                case PathIterator.SEG_MOVETO:
                    rotRect.setLocation((int)pathPoint[0], (int)pathPoint[1]);
                    break;
                }
            }
            camera.setZ((float)(cz + ((n == 0 || n == 4) ? 0 : home.getWallHeight())));
            camera.setYaw((float)(-Math.PI  + rotation));
            // String filename = path + File.separator + "stereo_house" + String.valueOf(n) + "." + imageType.toLowerCase();
            String filename = path + File.separator + "stereo_house." + imageType.toLowerCase();
            System.out.printf("正在生成第 %d 个立体图文件(%dx%d) ...%n", n + 1, rotRect.width, rotRect.height);
            BufferedImage photo = new BufferedImage(rotRect.width, rotRect.height, itype);
            renderer.render(photo, camera, null);
            // String ofilename = path + File.separator + "org_stereo_house" + String.valueOf(n) + "." + imageType.toLowerCase();
            // ImageIO.write(photo, imageType, new File(ofilename));
            ImageIO.write(postImage(photo, rotation, width, height, itype), imageType, new File(filename));
            System.out.printf("保存生成的立体图文件: %s%n", filename);
        }

    }

    public static void makePhoto(File homeFile, File outputFile,
                                 int width, int height, String imageType,
                                 String cameraName, String[] cameraVision)
        throws RecorderException {

        DefaultHomeInputStream in = null;
        Home home;
        try {
            // If preferences are not null replace home content by the one in preferences when it's the same
            in = new DefaultHomeInputStream(homeFile, ContentRecording.INCLUDE_ALL_CONTENT, null, null, false);
            home = in.readHome();

            // List<Level> levels = home.getLevels();
            // for (int i = 0; i < levels.size(); i++) {
            //     if (levels.get(i).isViewable()) {
            //         levels.get(i).setVisible(true);
            //         System.out.println("Level " + i);
            //     }
            // }

            Camera camera = null;
            List<Camera> cameras = home.getStoredCameras();
            for (int i = 0; i < cameras.size(); i ++) {
                camera = cameras.get(i);
                System.out.printf("%s: %f %f %f %f %f %f%n", camera.getName(), camera.getX(), camera.getY(), camera.getZ(),
                                  Math.toDegrees(camera.getFieldOfView()),
                                  Math.toDegrees(camera.getYaw()) % 360,
                                  Math.toDegrees(camera.getPitch()));
                if (cameras.get(i).getName().equalsIgnoreCase(cameraName)) {
                    camera = cameras.get(i);
                    break;
                }
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
            //renderer.render(photo, camera, null);

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

    public static void main(String[] args) {

        int n = args.length;
        if ( n == -1 ) {
            System.out.println("No home file\n");
            return;
        }

        String cameraName = null;
        String[] cameraVision = null;
        int imageWidth = 240;
        int imageHeight = 320;
        String imageType = "JPG";
        String outputFilename = "house.jpg";
        PhotoRenderer.Quality quality = PhotoRenderer.Quality.HIGH;

        int i = 0;
        while (i < n) {
            String arg = args[i];
            if (arg.equals("--camera")) {
                i ++;
                cameraName = args[i];
            }
            else if (arg.equals("--vision")) {
                i ++;
                cameraVision = args[i].split(",");
            }
            else if (arg.equals("--width")) {
                i ++;
                imageWidth = Integer.parseInt(args[i]);
            }
            else if (arg.equals("--height")) {
                i ++;
                imageHeight = Integer.parseInt(args[i]);
            }
            else if (arg.equals("--type")) {
                i ++;
                imageType = args[i].toUpperCase();
            }
            else if (arg.equals("--quality")) {
                i ++;
                quality = args[i].equalsIgnoreCase("HIGH") ? PhotoRenderer.Quality.HIGH : PhotoRenderer.Quality.LOW;
            }
            else if (arg.equals("--output")) {
                i ++;
                outputFilename = args[i];
            }
            else
                break;
            i ++;
        }

        if (!(i < n)) {
            System.out.println("Missing argument");
            return;
        }

        System.out.println("Render image from home: " + args[i]);
        try {
            makePhoto(new File(args[i]), new File(outputFilename), imageWidth, imageHeight, imageType, cameraName, cameraVision);
        } catch ( RecorderException ex ) {
            System.out.println(ex);
        } finally {
            System.out.println("Render image finished.");
        }
    }

}
