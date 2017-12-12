javac -encoding utf-8 -cp SweetHome3D-5.6.jar com/eteks/sweethome3d/plugin/exportjson/Exporter.java && \
javac -encoding utf-8 -cp "SweetHome3D-5.6.jar;lib/freehep-vectorgraphics-svg-2.1.1b.jar" com/eteks/sweethome3d/plugin/exporter/*.java && \
zip -r exporter.jar com/
