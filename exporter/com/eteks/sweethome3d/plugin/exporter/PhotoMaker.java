/*
 * ExportSVGPlugin.java
 *
 * Copyright (c) 2015 Emmanuel PUYBARET / eTeks <info@eteks.com>. All Rights Reserved.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 */
package com.eteks.sweethome3d.plugin.exporter;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.io.InterruptedIOException;
import java.util.List;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;

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

    public static void makePhoto(File homeFile, File outputFile, int width, int height, String imageType, String cameraName, String[] cameraVision)
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
            for (int i = 0; i < cameras.size(); i ++)
                if (cameras.get(i).getName().equalsIgnoreCase(cameraName)) {
                    camera = cameras.get(i);
                    break;
                }
            if (camera == null) {
                if (cameraVision == null)
                    camera = home.getTopCamera();
                else {
                    camera = new Camera(Float.parseFloat(cameraVision[0]),
                                        Float.parseFloat(cameraVision[1]),
                                        Float.parseFloat(cameraVision[2]),
                                        Float.parseFloat(cameraVision[3]),
                                        Float.parseFloat(cameraVision[4]),
                                        Float.parseFloat(cameraVision[5]));
                    cameraName = "Custom";
                }
            }
            System.out.println("Use camera: " + (cameraName == null ? "Default" : cameraName));
            System.out.println("Camera at: " + camera.getX() + ", " + camera.getY() + ", " + camera.getZ());
            System.out.println("Camera yaw: " + camera.getYaw());
            System.out.println("Camera pitch: " + camera.getPitch());
            System.out.println("Camera field of view: " + camera.getFieldOfView());

            System.out.println("Generate image (." + imageType.toLowerCase() + ", " + width + "x" + height + ")...");
            BufferedImage photo = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
            PhotoRenderer renderer = new PhotoRenderer(home, PhotoRenderer.Quality.LOW);
            renderer.render(photo, camera, null);

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
        int imageWidth = 960;
        int imageHeight = 1280;
        String imageType = "JPEG";
        String outputFilename = "house.jpeg";
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
