/*
 * HomeMapOptionalExporter.java
 *
 */
package com.eteks.sweethome3d.plugin.exportmap;

import java.awt.Dimension;
import java.awt.Graphics;
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
import java.util.Collection;
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
 */
public class HomeMapOptionalExporter extends PlanComponent {
    private String                            homeName;
    private String                            homeStructure;
    private int                               flags;
    private HashSet<Content>                  referencedContents;
    private float                             resolution;
    private float                             solidResolution;

    public HomeMapOptionalExporter(Home home, String homeName, String homeStructure, int flags) {
        UserPreferences preferences = new DefaultUserPreferences();
        preferences.setUnit(LengthUnit.METER);
        super(home, preferences, null, (PlanController)null);

        this.homeName = homeName;
        this.homeStructure = homeStructure;
        this.flags = flags;
        this.referencedContents = new HashSet<Content>();

        this.resolution = 0.02f;
        this.solidResolution = 0.02f;
    }

    public HashSet<Content> getReferencedContents() {
        return this.referencedContents;
    }

    /**
     * 使用分隔符连接数组成为一个字符串
     * @param strs 数组
     * @param splitter 分隔符
     * @return
     */
    private String join2(List<String> strs, String splitter) {
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
     * Returns the bounds of the given collection of <code>items</code>.
     */
    private Rectangle2D getItemsBounds(Graphics g, Collection<? extends Selectable> items) {
        Rectangle2D itemsBounds = null;
        for (Selectable item : items) {
            if (itemsBounds == null) {
                itemsBounds = getItemBounds(g, item);
            } else {
                itemsBounds.add(getItemBounds(g, item));
            }
        }
        return itemsBounds;
    }

    /**
     * Returns all the selectable and viewable items in this home, except the observer camera.
     * @return a list containing viewable walls, furniture, dimension lines, labels and compass.
     * @since 5.0
     */
    public List<Selectable> getSelectableViewableItems(Home home) {
        Level level = home.getSelectedLevel();
        List<Selectable> homeItems = new ArrayList<Selectable>();
        addViewableItems(home.getWalls(), homeItems);
        addViewableItems(home.getRooms(), homeItems);
        addViewableItems(home.getDimensionLines(), homeItems);
        addViewableItems(home.getPolylines(), homeItems);
        // addViewableItems(this.home.getLabels(), homeItems);
        for (HomePieceOfFurniture piece : home.getFurniture()) {
            if (piece.isVisible()
                && (piece.getName() == null)
                && (piece.getLevel() == null || piece.isAtLevel(level))) {
                homeItems.add(piece);
            }
        }
        // if (home.getCompass().isVisible()) {
        //   homeItems.add(this.home.getCompass());
        // }
        return homeItems;
    }

    public void writeHome(OutputStreamWriter writer, Home home) throws IOException {
        Rectangle2D itemBounds = getItemsBounds(home, getGraphics(), getSelectableViewableItems());

        float planScale = 1 / this.resolution / 100;
        String planFilename = "views/plan/plan_house.png";
        String imageType = "PNG";
        System.out.printf("输出缩放比例为 %f 的平面图到 %s%n", planScale, planFilename);
        plan.exportToPNG(planFilename, planScale, imageType);

        String solidPath = "views/solid/solid_house.jpg";        
        System.out.printf("输出分辨率为 %f 的立体图到目录 %s%n", solidResolution, solidPath);
        imageType = "JPG";
        PhotoMaker.makeStereoPhotos(home, itemBounds, solidResolution * 100, solidPath, imageType);

        writer.write(String.format("{%n  \"name\": \"%s\",%n", homeName == null ? "house" : homeName));
        writeRoomData(writer, home);
        writeViewData(writer, itemBounds);
        writer.write(String.format("}%n"));
        writer.flush();
    }

    /**
     * Writes total area of rooms and room polygons in <code>zipOut</code> stream
     */
    private void writeRoomData(OutputStreamWriter writer, Home home) throws IOException {
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
        writer.write(String.format("  \"polygons\": [%s],%n", join2(results, ", ")));
    }

    private void writeViewData(OutputStreamWriter writer, Rectangle2D itemBounds) throws IOException {
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
}
