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
package com.eteks.sweethome3d.plugin.exportjson;

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

// import com.eteks.sweethome3d.plugin.exportsvg.HomeJSONFileRecorder;
import com.eteks.sweethome3d.io.ContentRecording;
import com.eteks.sweethome3d.io.DefaultHomeInputStream;
import com.eteks.sweethome3d.model.HomeRecorder;
import com.eteks.sweethome3d.model.HomePieceOfFurniture;
import com.eteks.sweethome3d.model.Home;
import com.eteks.sweethome3d.model.Room;
import com.eteks.sweethome3d.model.InterruptedRecorderException;
import com.eteks.sweethome3d.model.Level;
import com.eteks.sweethome3d.model.RecorderException;
import com.eteks.sweethome3d.model.Selectable;
import com.eteks.sweethome3d.model.UserPreferences;
import com.eteks.sweethome3d.tools.OperatingSystem;

/**
 * Export room and image to json file.
 * @author Jondy Zhao
 */
public class Exporter {

    public static void printRoom(File homeFile) throws RecorderException {
        DefaultHomeInputStream in = null;
        Home home;
        try {
            // If preferences are not null replace home content by the one in preferences when it's the same
            in = new DefaultHomeInputStream(homeFile,
                                            ContentRecording.INCLUDE_ALL_CONTENT, null, null, false);
            home = in.readHome();

            List<Level> levels = home.getLevels();
            for (int i = 0; i < levels.size(); i++) {
                if (levels.get(i).isViewable()) {
                    levels.get(i).setVisible(true);
                    System.out.println("Level " + i);
                }
            }

            List<Room> rooms = home.getRooms();
            for (int i = 0; i < rooms.size(); i++) {
                System.out.println("Room " + i);
                float[][] points = rooms.get(i).getPoints();
                for (int j = 0; j < points.length; j++) {
                    if ( points[j].length == 2 )
                        System.out.println(" (" + points[j][0] + ",  " + points[j][1] + ")");
                    else
                        System.out.println(" point length is not 2");
                }
            }            

            List<HomePieceOfFurniture> furnitures = home.getFurniture();
            for (int i = 0; i < furnitures.size(); i++) {
                HomePieceOfFurniture furniture = furnitures.get(i);
                System.out.println("Furniture " + i + " : " + furniture.getName());
                System.out.println("x: " + furniture.getX() + ", y: " + furniture.getY());
            }

        } catch (InterruptedIOException ex) {
            throw new InterruptedRecorderException("Save home to XML");
        } catch (IOException ex) {
            throw new RecorderException("Couldn't read exported home to XML", ex);
        } catch (ClassNotFoundException ex) {
            // Shouldn't happen
            throw new RecorderException("Couldn't read exported home to XML", ex);
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
        if ( args.length < 1 ) {
            System.out.println("No home file\n");
            return;
        }

        System.out.println("Home file: " + args[0]);
        try {
            printRoom(new File(args[0]));
        } catch ( RecorderException ex ) {
            System.out.println("Something is wrong: " + ex);
        }
        // for(int i=0;i<args.length;i++){
        //     System.out.println(args[i]);
        // }
    }

}
