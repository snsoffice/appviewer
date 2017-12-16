/*
 * PlanExport.java
 *
 */
package com.eteks.sweethome3d.plugin.exporter;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
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
import java.io.InterruptedIOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;

import java.text.Format;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import javax.imageio.ImageIO;

import com.eteks.sweethome3d.model.Compass;
import com.eteks.sweethome3d.model.Camera;
import com.eteks.sweethome3d.model.DimensionLine;
import com.eteks.sweethome3d.model.Elevatable;
import com.eteks.sweethome3d.model.Home;
import com.eteks.sweethome3d.model.HomeApplication;
import com.eteks.sweethome3d.model.HomeEnvironment;
import com.eteks.sweethome3d.model.HomeFurnitureGroup;
import com.eteks.sweethome3d.model.HomeRecorder;
import com.eteks.sweethome3d.model.HomePieceOfFurniture;
import com.eteks.sweethome3d.model.InterruptedRecorderException;
import com.eteks.sweethome3d.model.LengthUnit;
import com.eteks.sweethome3d.model.Level;
import com.eteks.sweethome3d.model.Polyline;
import com.eteks.sweethome3d.model.RecorderException;
import com.eteks.sweethome3d.model.Room;
import com.eteks.sweethome3d.model.Selectable;
import com.eteks.sweethome3d.model.UserPreferences;
import com.eteks.sweethome3d.model.Wall;

import com.eteks.sweethome3d.swing.PlanComponent;

import com.eteks.sweethome3d.viewcontroller.PlanController;


/**
 * Export plan
 * @author Jondy Zhao
 */
public class PlanExport extends PlanComponent {

    private static final float       WALL_STROKE_WIDTH = 1.5f;
    private static final float       BORDER_STROKE_WIDTH = 1f;
    private static final String      PHOTO_GROUP = "Photos";
    private static final String      PANORAMA_GROUP = "Panoramas";
    private static final String      PAGE_GROUP = "Pages";
    private static final char        CSV_FIELD_SEPARATOR = ',';

    private final Home            home;
    private final UserPreferences preferences;

    /**
     * Creates a new plan that displays <code>home</code>.
     * @param home the home to display
     * @param preferences user preferences to retrieve used unit, grid visibility...
     * @param controller the optional controller used to manage home items modification
     */
    public PlanExport(Home home,
                      UserPreferences preferences) {
        super(home, preferences, null, (PlanController)null);
        this.home = home;
        this.preferences = preferences;
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
     * Returns all the selectable and viewable items in this home, except the observer camera.
     * @return a list containing viewable walls, furniture, dimension lines, labels and compass.
     * @since 5.0
     */
    public List<Selectable> getSelectableViewableItems() {
        List<Selectable> homeItems = new ArrayList<Selectable>();
        addViewableItems(this.home.getWalls(), homeItems);
        addViewableItems(this.home.getRooms(), homeItems);
        addViewableItems(this.home.getDimensionLines(), homeItems);
        addViewableItems(this.home.getPolylines(), homeItems);
        addViewableItems(this.home.getLabels(), homeItems);
        for (HomePieceOfFurniture piece : this.home.getFurniture()) {
            if (piece.isVisible()
                && (piece.getLevel() == null
                    || piece.getLevel().isViewable())) {
                homeItems.add(piece);
            }
        }
        // if (this.home.getCompass().isVisible()) {
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
     * Sets rendering hints used to paint plan.
     */
    private void setRenderingHints(Graphics2D g2D) {
        g2D.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2D.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2D.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g2D.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_ON);
    }

    /**
     * Returns the bounds of the given collection of <code>items</code>.
     */
    public Rectangle2D getItemsBounds() {
        return getItemsBounds(getGraphics(), getSelectableViewableItems());
    }

    public double getExtraMargin() {
        return getStrokeWidthExtraMargin(getSelectableViewableItems(), PaintMode.CLIPBOARD);
    }

    /**
     * Export plan to PNG
     */
    public BufferedImage getPlanImage(float clipboardScale, int imageType) {
        // Create an image that contains only selected items

        // home.getSelectableViewableItems()
        List<Selectable> selectedItems = getSelectableViewableItems();
        Rectangle2D selectionBounds = getItemsBounds(getGraphics(), selectedItems);
        if (selectionBounds == null)
            return null;

        home.setSelectedItems(selectedItems);
        // Use a scale of .5
        // float clipboardScale = .5f;
        float extraMargin = getStrokeWidthExtraMargin(this.home.getSelectedItems(), PaintMode.CLIPBOARD);
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

    public void exportToPNG(String filename, float scale, String imageType) throws IOException {
        int itype = imageType.equals("PNG") ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
        BufferedImage photo = getPlanImage(scale, itype);
        ImageIO.write(photo, imageType, new File(filename));
    }

    /**
     * Get FurnitureGroup
     */
    public List<HomeFurnitureGroup> getFurnitureGroups() {
        return this.home.getSubList(this.home.getFurniture(), HomeFurnitureGroup.class);
    }

    /**
     * Write photo to CSV data.
     */
    private void writePhotoData(OutputStreamWriter writer,
                                HomePieceOfFurniture homeFurniture,
                                Format sizeFormat) throws IOException {
        String catalogId = homeFurniture.getCatalogId();
        writer.write(catalogId != null ? catalogId : "");
        writer.write(CSV_FIELD_SEPARATOR);

        writer.write(homeFurniture.getName());
        writer.write(CSV_FIELD_SEPARATOR);

        String creators = homeFurniture.getCreator();
        if (creators != null) {
            writer.write(creators);
            writer.write(CSV_FIELD_SEPARATOR);
        }

        writer.write(homeFurniture.getLevel() != null
                     ? homeFurniture.getLevel().getName()
                     : "");
        writer.write(CSV_FIELD_SEPARATOR);

        if (homeFurniture.getTexture() != null) {
            writer.write(homeFurniture.getTexture().getName());
            writer.write(CSV_FIELD_SEPARATOR);
        }

        writer.write(sizeFormat.format(homeFurniture.getWidth()));
        writer.write(CSV_FIELD_SEPARATOR);

        writer.write(sizeFormat.format(homeFurniture.getDepth()));
        writer.write(CSV_FIELD_SEPARATOR);

        writer.write(sizeFormat.format(homeFurniture.getHeight()));
        writer.write(CSV_FIELD_SEPARATOR);

        writer.write(sizeFormat.format(homeFurniture.getX()));
        writer.write(CSV_FIELD_SEPARATOR);

        writer.write(sizeFormat.format(homeFurniture.getY()));
        writer.write(CSV_FIELD_SEPARATOR);

        writer.write(sizeFormat.format(homeFurniture.getElevation()));
        writer.write(CSV_FIELD_SEPARATOR);

        writer.write(String.valueOf(homeFurniture.getAngle()));
        writer.write(CSV_FIELD_SEPARATOR);

        writer.write(System.getProperty("line.separator"));
    }

    /**
     * Write panorama to CSV Data.
     */
    private void writePanoramaData(OutputStreamWriter writer,
                                   HomePieceOfFurniture homeFurniture,
                                   Format sizeFormat) throws IOException {
        writer.write(System.getProperty("line.separator"));
    }

    private String formatFeature(HomePieceOfFurniture homeFurniture, String baseUrl, String fmt) {
        return String.format("{x: %f, y: %f, z: %f, yaw: %f, url: \"%s\", format: \"%s\"},%n",
                             homeFurniture.getX() / 100,
                             homeFurniture.getY() / 100,
                             homeFurniture.getElevation() / 100,
                             homeFurniture.getAngle(),
                             baseUrl + "/" + homeFurniture.getName(),
                             homeFurniture.getCreator());
    }

    public void writeData(OutputStreamWriter writer, String baseUrl) throws IOException {
        String photos = "";
        String panoramas = "";

        for (HomeFurnitureGroup group: getFurnitureGroups()) {
            if (group.getName().equalsIgnoreCase(PHOTO_GROUP)) {
                for (HomePieceOfFurniture homeFurniture: group.getAllFurniture())
                    photos += formatFeature(homeFurniture, baseUrl + "/features/photo", "png");
            }
            else if (group.getName().equalsIgnoreCase(PANORAMA_GROUP)) {
                for (HomePieceOfFurniture homeFurniture: group.getAllFurniture())
                    panoramas += formatFeature(homeFurniture, baseUrl + "/features/panorama", "equirectangular");
            }
        }


        writer.write(String.format("features: {%n"));

        writer.write(String.format("photo: [%n%s],%n", photos));
        writer.write(String.format("panorama: [%n%s],%n", panoramas));
        writer.write(String.format("page: []%n"));

        writer.write(String.format("},%n"));
    }

    /**
     * Exports photo/panorama group to a given CSV file.
     */
    public void exportToCSV(String csvFile) throws RecorderException {
        OutputStream out = null;
        boolean exportInterrupted = false;
        try {
            out = new BufferedOutputStream(new FileOutputStream(csvFile));
            OutputStreamWriter writer = new OutputStreamWriter(out);
            Format sizeFormat;
            if (this.preferences.getLengthUnit() == LengthUnit.INCH) {
                sizeFormat = LengthUnit.INCH_DECIMALS.getFormat();
            } else {
                sizeFormat = this.preferences.getLengthUnit().getFormat();
            }

            for (HomeFurnitureGroup group: getFurnitureGroups()) {
                if (group.getName().equalsIgnoreCase(PHOTO_GROUP)) {
                    for (HomePieceOfFurniture homeFurniture: group.getAllFurniture())
                        writePhotoData(writer, homeFurniture, sizeFormat);
                }
                else if (group.getName().equalsIgnoreCase(PANORAMA_GROUP)) {
                    for (HomePieceOfFurniture homeFurniture: group.getAllFurniture())
                        writePanoramaData(writer, homeFurniture, sizeFormat);
                }
            }
            writer.flush();
        } catch (InterruptedIOException ex) {
            exportInterrupted = true;
            throw new InterruptedRecorderException("Export to " + csvFile + " interrupted");
        } catch (IOException ex) {
            throw new RecorderException("Couldn't export to CSV in " + csvFile, ex);
        } finally {
            if (out != null) {
                try {
                    out.close();
                    // Delete the file if exporting is interrupted
                    if (exportInterrupted) {
                        new File(csvFile).delete();
                    }
                } catch (IOException ex) {
                    throw new RecorderException("Couldn't export to CSV in " + csvFile, ex);
                }
            }
        }
    }

}
