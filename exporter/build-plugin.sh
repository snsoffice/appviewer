sources="com/eteks/sweethome3d/plugin/exportmap/ExportMapPlugin.java com/eteks/sweethome3d/plugin/exportmap/HomeMapFileRecorder.java com/eteks/sweethome3d/plugin/exportmap/HomeMapOptionalExporter.java com/eteks/sweethome3d/plugin/exportmap/RedirectedURLContent.java"
javac -encoding utf-8 -cp "lib/SweetHome3D-5.6.jar;lib/freehep-vectorgraphics-svg-2.1.1b.jar;lib/j3dcore.jar;lib/sunflow-0.07.3i.jar;lib/vecmath.jar;lib/batik-svgpathparser-1.7.jar;lib/j3dutils.jar" $sources && \
zip -r export-future-map.sh3p com/eteks/sweethome3d/plugin/exportmap && \
cp export-future-map.sh3p "C:/Documents and Settings/Administrator/Application Data/eTeks/Sweet Home 3D/plugins/"
