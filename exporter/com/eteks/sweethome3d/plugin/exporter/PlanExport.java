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

    private final Home            home;

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
     * Export plan to PNG
     */
    public BufferedImage getPlanImage(float clipboardScale) {
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
                                                (int)Math.ceil(selectionBounds.getHeight() * clipboardScale + 2 * extraMargin), BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2D = (Graphics2D)image.getGraphics();
        // Paint background in white
        g2D.setColor(Color.WHITE);
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

    /**
     * Get FurnitureGroup
     */
    public List<HomeFurnitureGroup> getFurnitureGroups() {
        return this.home.getSubList(getFurniture(), HomeFurnitureGroup.class);
    }

}
