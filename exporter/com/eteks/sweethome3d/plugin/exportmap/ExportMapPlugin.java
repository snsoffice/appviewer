/*
 * ExportMapPlugin.java 
 *
 */
package com.eteks.sweethome3d.plugin.exportmap;

import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Locale;
import java.util.ResourceBundle;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import javax.swing.JComponent;
import javax.swing.JEditorPane;
import javax.swing.JOptionPane;
import javax.swing.event.HyperlinkEvent;
import javax.swing.event.HyperlinkListener;
import javax.swing.filechooser.FileFilter;

import com.eteks.sweethome3d.model.Home;
import com.eteks.sweethome3d.model.HomeRecorder;
import com.eteks.sweethome3d.model.InterruptedRecorderException;
import com.eteks.sweethome3d.model.RecorderException;
import com.eteks.sweethome3d.plugin.Plugin;
import com.eteks.sweethome3d.plugin.PluginAction;
import com.eteks.sweethome3d.plugin.exportmap.HomeMapFileRecorder;
import com.eteks.sweethome3d.swing.FileContentManager;
import com.eteks.sweethome3d.swing.HomeComponent3D;
import com.eteks.sweethome3d.swing.SwingViewFactory;
import com.eteks.sweethome3d.tools.OperatingSystem;
import com.eteks.sweethome3d.viewcontroller.ContentManager;
import com.eteks.sweethome3d.viewcontroller.HomeView;
import com.eteks.sweethome3d.viewcontroller.ThreadedTaskController;

/**
 * A plug-in that generates a zip file containing resources used by iFuture Map.
 * @author Jondy Zhao
 */
public class ExportMapPlugin extends Plugin {
  @Override
  public PluginAction [] getActions() {
      return new PluginAction [] { 
          new ExportMapPluginAction("com.eteks.sweethome3d.plugin.exportmap.ApplicationPlugin", 
                                    "EXPORT_TO_MAP", getPluginClassLoader(), true)
      };
  }

  protected class ExportMapPluginAction extends PluginAction {
    private String resourceBaseName;

    public ExportMapPluginAction(String resourceBaseName,  String actionPrefix, ClassLoader pluginClassLoader, boolean enabled) {
      super(resourceBaseName, actionPrefix, pluginClassLoader, enabled);
      this.resourceBaseName = resourceBaseName;
    }
  
    /**
     * Exports edited home.
     */
    public void execute() {
      final ResourceBundle resource = ResourceBundle.getBundle(this.resourceBaseName, 
          Locale.getDefault(), getPluginClassLoader());
      final HomeView homeView = getHomeController().getView();
      
      ContentManager contentManagerWithZipExtension = new FileContentManager(getUserPreferences()) {
        private final String ZIP_EXTENSION = ".zip";
        private final FileFilter ZIP_FILE_FILTER = new FileFilter() {
          @Override
          public boolean accept(File file) {
            // Accept directories and ZIP files
            return file.isDirectory()
                || file.getName().toLowerCase().endsWith(ZIP_EXTENSION);
          }
          
          @Override
          public String getDescription() {
            return "ZIP";
          }
        };
        
        @Override
        public String getDefaultFileExtension(ContentType contentType) {
          if (contentType == ContentType.USER_DEFINED) {
            return ZIP_EXTENSION;
          } else {
            return super.getDefaultFileExtension(contentType);
          }
        }
        
        @Override
        protected String [] getFileExtensions(ContentType contentType) {
          if (contentType == ContentType.USER_DEFINED) {
            return new String [] {ZIP_EXTENSION};
          } else {
            return super.getFileExtensions(contentType);
          }
        }
        
        @Override
        protected FileFilter [] getFileFilter(ContentType contentType) {
          if (contentType == ContentType.USER_DEFINED) {
            return new FileFilter [] {ZIP_FILE_FILTER};
          } else {
            return super.getFileFilter(contentType);
          }
        }
      };
      
      // Request a file name 
      final String exportedFile = contentManagerWithZipExtension.showSaveDialog(homeView,
          resource.getString("exportMapDialog.title"), 
          ContentManager.ContentType.USER_DEFINED, getHome().getName());
      if (exportedFile != null) {

          // 离线快速生成当前三维视图的照片
          // makePhoto((new File(exportedFile)).getParent());

          // ExecutorService photoCreationExecutor = Executors.newSingleThreadExecutor();
          // photoCreationExecutor.execute(new Runnable() {
          //         public void run() {
          //             Thread.currentThread().setPriority(Thread.MAX_PRIORITY);
          //             try {
          //                 exportHomeToMap(getHome().clone(), new File(exportedFile));
          //                 homeView.showMessage( "导出成功" );
          //             }
          //             catch ( RecorderException ex ) {
          //                 homeView.showMessage( "导出失败!" );
          //             }
          //         }
          //     });

        // Export to snsoffice in a threaded task
        Callable<Void> exportToObjTask = new Callable<Void>() {
          public Void call() throws RecorderException {
              Thread.currentThread().setPriority(Thread.MAX_PRIORITY);
              exportHomeToMap(getHome().clone(), new File(exportedFile));              
              return null;
          }
        };

        ThreadedTaskController.ExceptionHandler exceptionHandler = 
            new ThreadedTaskController.ExceptionHandler() {
          public void handleException(Exception ex) {
            if (!(ex instanceof InterruptedRecorderException)) {
              ex.printStackTrace();
              getHomeController().getView().showError(
                  String.format(resource.getString("exportMapError.message"), ex.getMessage()));
            }
          }
        };
        new ThreadedTaskController(exportToObjTask, 
            resource.getString("exportMapMessage"), exceptionHandler, 
            getUserPreferences(), new SwingViewFactory()).executeTask(homeView);
      }
    }
    
    /**
     * Exports the given <code>home</code> to HTML5.
     * Caution: this method is called from a separate thread.
     */
    private void exportHomeToMap(Home home, 
                                 File exportedFile) throws RecorderException {
      File homeFile = null;
      ZipOutputStream zipOut = null;
      boolean finished = false;
      try {
        // That's enough
        getHomeRecorder().writeHome(home, exportedFile.getAbsolutePath());
        if (true)
          return;

        // Create a temporary file 
        homeFile = OperatingSystem.createTemporaryFile("Home", ".zip");
        getHomeRecorder().writeHome(home, homeFile.getAbsolutePath());
        // Add home file to the selected file
        zipOut = new ZipOutputStream(new FileOutputStream(exportedFile));
        zipOut.setLevel(9);
        String exportedHomeFile = exportedFile.getName();        
        writeZipEntry(zipOut, exportedHomeFile, homeFile.toURI().toURL(), null);
        zipOut.finish();
        finished = true;
      } catch (IOException ex) {
        throw new RecorderException("Couldn't save " + exportedFile.getName(), ex);
      } finally {
        if (zipOut != null) {
          try {
            zipOut.close();
            if (!finished) {
              exportedFile.delete();
            }
          } catch (IOException ex) {
            throw new RecorderException("Couldn't close " + exportedFile.getName(), ex);
          }
        }
        if (homeFile != null) {
          homeFile.delete();
        }
      }    
    }

    /**
     * Make photo from HomeController3D
     */
    private void makePhoto(String path) {
        Home home = getHome().clone();
        BufferedImage image = null;
        String imageType = "JPG";
        File outputFile = new File(path + File.separator + "house.jpg");
        int imageWidth = 512;
        int imageHeight = 512;
        try {
            HomeComponent3D component = new HomeComponent3D(home, getHomeController().getHomeController3D());
            image = component.getOffScreenImage(imageWidth, imageHeight);
            ImageIO.write(image, imageType, outputFile);
        } catch (IOException ex) {
            getHomeController().getView().showMessage("Couldn't save " + outputFile.getName());
        } finally {
        }    
    }
    
    private void writeZipEntry(ZipOutputStream zipOut, String entryName, 
                               URL source, String exportHomeFile) throws IOException {
      byte [] buffer = new byte [8192];
      InputStream in = null;
      try {
        zipOut.putNextEntry(new ZipEntry(entryName));
        in = source.openStream();
        if (exportHomeFile != null) {
          BufferedReader reader = new BufferedReader(new InputStreamReader(in, "UTF-8"));
          Writer writer = new OutputStreamWriter(zipOut, "UTF-8");
          for (String line; (line = reader.readLine()) != null; ) {
            writer.write(line.replace("${exportedHome}", exportHomeFile)
                .replace("${version}", getVersion()));
            writer.write("\n");
          }
          writer.flush();
        } else {
          for (int size; (size = in.read(buffer)) != -1; ) {
            zipOut.write(buffer, 0, size);
          }
        }      
        zipOut.closeEntry();  
      } finally {
        if (in != null) {          
          in.close();
        }
      }
    }
    
    protected HomeRecorder getHomeRecorder() {
      return new HomeMapFileRecorder(9, 
          HomeMapFileRecorder.INCLUDE_VIEWER_DATA 
          | HomeMapFileRecorder.INCLUDE_HOME_STRUCTURE 
          | HomeMapFileRecorder.REDUCE_IMAGES 
          | HomeMapFileRecorder.CONVERT_MODELS_TO_OBJ_FORMAT, 256);
    }
  }
}
