/*
 * HomeMapOptionalExporter.java
 *
 */
package com.eteks.sweethome3d.plugin.exportmap;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Rectangle;
import java.awt.RenderingHints;
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
import java.net.URL;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.imageio.ImageIO;

import org.freehep.util.UserProperties;
import org.freehep.graphics2d.PixelGraphics2D;
import org.freehep.graphicsio.ImageConstants;
import org.freehep.graphicsio.ImageGraphics2D;
import org.freehep.graphicsio.svg.SVGGraphics2D;

import com.eteks.sweethome3d.io.ContentRecording;
import com.eteks.sweethome3d.io.DefaultHomeInputStream;
import com.eteks.sweethome3d.j3d.PhotoRenderer;
import com.eteks.sweethome3d.model.Compass;
import com.eteks.sweethome3d.model.Content;
import com.eteks.sweethome3d.model.Camera;
import com.eteks.sweethome3d.model.DimensionLine;
import com.eteks.sweethome3d.model.Elevatable;
import com.eteks.sweethome3d.model.Home;
import com.eteks.sweethome3d.model.HomeApplication;
import com.eteks.sweethome3d.model.HomeEnvironment;
import com.eteks.sweethome3d.model.HomeRecorder;
import com.eteks.sweethome3d.model.HomePieceOfFurniture;
import com.eteks.sweethome3d.model.InterruptedRecorderException;
import com.eteks.sweethome3d.model.Label;
import com.eteks.sweethome3d.model.Level;
import com.eteks.sweethome3d.model.Polyline;
import com.eteks.sweethome3d.model.RecorderException;
import com.eteks.sweethome3d.model.Room;
import com.eteks.sweethome3d.model.Selectable;
import com.eteks.sweethome3d.model.Wall;
import com.eteks.sweethome3d.model.UserPreferences;
import com.eteks.sweethome3d.swing.HomePane;
import com.eteks.sweethome3d.swing.PlanComponent;
import com.eteks.sweethome3d.swing.SwingViewFactory;
import com.eteks.sweethome3d.tools.OperatingSystem;
import com.eteks.sweethome3d.tools.URLContent;
import com.eteks.sweethome3d.viewcontroller.PlanController;


/**
 * 根据模型生成远景网地图需要的资源文件
 */
public class HomeMapOptionalExporter extends PlanComponent {

    private static final float       WALL_STROKE_WIDTH = 1.5f;
    private static final float       BORDER_STROKE_WIDTH = 1f;

    private String                            homeName;
    private String                            homeStructure;
    private int                               flags;
    private HashSet<Content>                  referencedContents;
    private HashMap<String, Content>          exportedContents;

    private float                             resolution;
    private float                             solidResolution;

    public HomeMapOptionalExporter(Home home, UserPreferences preferences, String homeName, String homeStructure, int flags) {
        super(home, preferences, (PlanController)null);

        this.homeName = homeName;
        this.homeStructure = homeStructure;
        this.flags = flags;
        this.referencedContents = new HashSet<Content>();
        this.exportedContents = new HashMap<String, Content>();
        this.resolution = 0.02f;
        this.solidResolution = 0.02f;
    }

    public HashSet<Content> getReferencedContents() {
        return this.referencedContents;
    }

    public HashMap<String, Content> getExportedContents() {
        return this.exportedContents;
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
     * Adds the viewable items to the set of selectable viewable items.
     */
    private <T extends Selectable> void addViewableItems(Collection<T> items,
                                                         List<Selectable> selectableViewableItems) {
        for (T item : items) {
            if (item instanceof Elevatable) {
                Elevatable elevatableItem = (Elevatable)item;
                if (elevatableItem.getLevel() == null
                    || elevatableItem.getLevel().isViewable()) {
                    selectableViewableItems.add(item);
                }
            }
        }
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

    /**
     * Returns the margin that should be added around home items bounds to ensure their
     * line stroke width is always fully visible.
     */
    private float getStrokeWidthExtraMargin(List<Selectable> items, PaintMode paintMode) {
        float extraMargin = BORDER_STROKE_WIDTH;
        if (Home.getFurnitureSubList(items).size() > 0) {
            extraMargin = Math.max(extraMargin, getStrokeWidth(HomePieceOfFurniture.class, paintMode));
        }
        if (Home.getWallsSubList(items).size() > 0) {
            extraMargin = Math.max(extraMargin, getStrokeWidth(Wall.class, paintMode));
        }
        if (Home.getRoomsSubList(items).size() > 0) {
            extraMargin = Math.max(extraMargin, getStrokeWidth(Room.class, paintMode));
        }
        List<Polyline> polylines = Home.getPolylinesSubList(items);
        if (polylines.size() > 0) {
            for (Polyline polyline : polylines) {
                extraMargin = Math.max(extraMargin, polyline.getStartArrowStyle() != null ||  polyline.getEndArrowStyle() != null
                                       ? 1.5f * polyline.getThickness()
                                       : polyline.getThickness());
            }
        }
        if (Home.getDimensionLinesSubList(items).size() > 0) {
            extraMargin = Math.max(extraMargin, getStrokeWidth(DimensionLine.class, paintMode));
        }
        return extraMargin / 2;
    }

    /**
     * Returns the stroke width used to paint an item of the given class.
     */
    private float getStrokeWidth(Class<? extends Selectable> itemClass, PaintMode paintMode) {
        float strokeWidth;
        if (Wall.class.isAssignableFrom(itemClass)
            || Room.class.isAssignableFrom(itemClass)) {
            strokeWidth = WALL_STROKE_WIDTH;
        } else {
            strokeWidth = BORDER_STROKE_WIDTH;
        }
        if (paintMode == PaintMode.PRINT) {
            strokeWidth *= 0.5;
        }
        return strokeWidth;
    }

    /**
     * Sets rendering hints used to paint plan.
     */
    private void setRenderingHints(Graphics2D g2D) {
        g2D.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2D.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2D.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g2D.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_ON);
    }

    /**
     * Export plan to PNG
     */
    private BufferedImage getPlanImage(Home home, float clipboardScale, int imageType) {
        // home.getSelectableViewableItems()
        List<Selectable> selectedItems = getSelectableViewableItems(home);
        Rectangle2D selectionBounds = getItemsBounds(getGraphics(), selectedItems);
        if (selectionBounds == null)
            return null;

        home.setSelectedItems(selectedItems);
        // Use a scale of .5
        // float clipboardScale = .5f;
        float extraMargin = getStrokeWidthExtraMargin(home.getSelectedItems(), PaintMode.CLIPBOARD);
        BufferedImage image = new BufferedImage((int)Math.ceil(selectionBounds.getWidth() * clipboardScale + 2 * extraMargin),
                                                (int)Math.ceil(selectionBounds.getHeight() * clipboardScale + 2 * extraMargin),
                                                imageType);
        Graphics2D g2D = (Graphics2D)image.getGraphics();
        // Paint background in white
        g2D.setColor(new Color(0, 0, 0, 0));
        g2D.fillRect(0, 0, image.getWidth(), image.getHeight());
        // Change component coordinates system to plan system
        g2D.scale(clipboardScale, clipboardScale);
        g2D.translate(-selectionBounds.getMinX() + extraMargin,
                      -selectionBounds.getMinY() + extraMargin);
        setRenderingHints(g2D);
        Color backgroundColor = getBackgroundColor(PaintMode.CLIPBOARD);
        Color foregroundColor = getForegroundColor(PaintMode.CLIPBOARD);
        try {
            // Paint component contents
            paintHomeItems(g2D, clipboardScale, backgroundColor, foregroundColor, PaintMode.CLIPBOARD);
        } catch (InterruptedIOException ex) {
            // Ignore exception because it may happen only in EXPORT paint mode
            return null;
        } finally {
            g2D.dispose();
        }
        return image;
    }

    private void exportToPNG(Home home, String filename, float scale, String imageType) throws IOException {
        int itype = imageType.equals("PNG") ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
        BufferedImage photo = getPlanImage(home, scale, itype);
        ImageIO.write(photo, imageType, new File(filename));
    }

    public void writeHome(OutputStreamWriter writer, Home home) throws IOException {
        Rectangle2D itemBounds = getItemsBounds(getGraphics(), getSelectableViewableItems(home));

        File tempPlanFile = OperatingSystem.createTemporaryFile("plane_house", ".png");
        float planScale = 1 / this.resolution / 100;
        String planFilename = "views/plane/plane_house.png";
        String imageType = "PNG";
        System.out.printf("输出缩放比例为 %f 的平面图到 %s%n", planScale, planFilename);
        exportToPNG(home, tempPlanFile.getAbsolutePath(), planScale, imageType);
        this.exportedContents.put(planFilename, new URLContent(tempPlanFile.toURI().toURL()));

        File tempSolidFile = OperatingSystem.createTemporaryFile("solid_house", ".jpg");
        String solidFilename = "views/solid/solid_house.jpg";
        imageType = "JPG";
        makePhoto(home, itemBounds, tempSolidFile, imageType);
        this.exportedContents.put(solidFilename, new URLContent(tempSolidFile.toURI().toURL()));

        writer.write(String.format("{%n  \"name\": \"%s\",%n", homeName == null ? "house" : homeName));
        writeRoomData(writer, home);
        writeViewData(writer, itemBounds);
        writer.write(String.format("}%n"));
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

        writer.write(String.format("%s{%n%s\"type\": \"plane\",%n" +
                                   "%s\"extent\": [ %f, %f, %f, %f ],%n" +
                                   "%s\"source\": \"plane_house.png\"%n" +
                                   "%s},%n",
                                   indent2, indent3, indent3,
                                   x0, y0, x1, y1,
                                   indent3, indent2));

        writer.write(String.format("%s{%n%s\"type\": \"solid\",%n" +
                                   "%s\"extent\": [ %f, %f, %f, %f ],%n" +
                                   "%s\"source\": \"solid_house.jpg\"%n" +
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

    /**
     * 计算相机高度，使之正好能把整个房屋拍下。
     * @author Jondy Zhao
     */
    private double calculateCameraElevation(Rectangle2D itemBounds, double fov) {
        return Math.max(itemBounds.getWidth(), itemBounds.getHeight()) / 2 / Math.tan(fov / 2);
    }

    /**
     * itemBounds 的单位为 米
     *
     * resolution 是每个像素的所代表的长度（米），例如 0.02 表示每个像
     * 素代表 0.02 米，所以 1米需要 50 个像素
     *
     */
    private void makePhoto(Home home, Rectangle2D itemBounds, double resolution,
                           File output, String imageType) throws IOException {
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
        BufferedImage photo = new BufferedImage(width, height, itype);
        renderer.render(photo, camera, null);
        renderer.dispose();
        ImageIO.write(photo, imageType, output);
    }

    /**
     * itemBounds 的单位为 米
     *
     * 像素的最大尺寸为 512
     *
     */
    private  void makePhoto(Home home, Rectangle2D itemBounds, File output, String imageType) throws IOException {
        // 计算像素坐标，最大不超过 512
        int MAX_SIZE = 256;       
        int width, height;
        double ratio = itemBounds.getWidth() / itemBounds.getHeight();

        height = ratio < 1.0 ? MAX_SIZE : (int)(MAX_SIZE / ratio);
        width = (int)(height * ratio);

        double pitch = Math.PI / 2;
        double fov = Math.PI / 180 * 63;
        int itype = imageType.equalsIgnoreCase("PNG") ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;

        double cx = itemBounds.getCenterX();
        double cy = itemBounds.getCenterY();

        double r = Math.max(itemBounds.getWidth(), itemBounds.getHeight());        
        double cz = r / 2 / Math.tan(fov / 2 - ( r > 300.0 ? 0.05 : 0 ) );

        Camera camera = home.getTopCamera();
        camera.setX((float)cx);
        camera.setY((float)cy);
        camera.setZ((float)cz);
        camera.setYaw((float)Math.PI); // 默认上方为北
        camera.setPitch((float)pitch);
        camera.setFieldOfView((float)fov);
        // 2017-11-04 PM 5:00 室内有灯光，也不太暗
        // camera.setTime(1509814800689L); 

        PhotoRenderer renderer = new PhotoRenderer(home, PhotoRenderer.Quality.HIGH);
        BufferedImage photo = new BufferedImage(width, height, itype);
        renderer.render(photo, camera, null);
        ImageIO.write(photo, imageType, output);
        renderer.dispose();
    }

    /**
     * 为保存的所有相机生成对应的图片
     *
     * 像素的最大尺寸为 512
     *
     */
    private  void makePhotos(Home home, Rectangle2D itemBounds, File output, String imageType) throws IOException {
        // 计算像素坐标，最大不超过 512
        int MAX_SIZE = 256;
        int width, height;
        double ratio = itemBounds.getWidth() / itemBounds.getHeight();

        height = ratio < 1.0 ? MAX_SIZE : (int)(MAX_SIZE / ratio);
        width = (int)(height * ratio);

        int itype = imageType.equalsIgnoreCase("PNG") ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
        Camera camera = null;
        List<Camera> cameras = home.getStoredCameras();

        PhotoRenderer renderer = new PhotoRenderer(home, PhotoRenderer.Quality.HIGH);
        for (int i = 0; i < cameras.size(); i ++) {
            camera = cameras.get(i);
            BufferedImage photo = new BufferedImage(width, height, itype);
            renderer.render(photo, camera, null);
            ImageIO.write(photo, imageType, output);
        }
        renderer.dispose();
    }

    public void placeCameraAt(Camera camera, float x, float y, float distanceToCenter) {
      float z = 0;
      double distanceToCenterAtGroundLevel = distanceToCenter * Math.cos(camera.getPitch());
      camera.setX(x + (float)(Math.sin(camera.getYaw()) * distanceToCenterAtGroundLevel));
      camera.setY(y - (float)(Math.cos(camera.getYaw()) * distanceToCenterAtGroundLevel));
      camera.setZ(z + (float)Math.sin(camera.getPitch()) * distanceToCenter);
    }

}
