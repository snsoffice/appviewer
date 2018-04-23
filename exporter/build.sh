javac -encoding utf-8 -cp lib/SweetHome3D-5.6.jar com/eteks/sweethome3d/plugin/exportjson/Exporter.java && \
javac -encoding utf-8 -cp "lib/SweetHome3D-5.6.jar;lib/freehep-vectorgraphics-svg-2.1.1b.jar;lib/j3dcore.jar;lib/sunflow-0.07.3i.jar;lib/vecmath.jar;lib/batik-svgpathparser-1.7.jar;lib/j3dutils.jar" com/eteks/sweethome3d/plugin/exporter/*.java && \
zip -r exporter.jar com/
