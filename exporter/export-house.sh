libpath=$(dirname $0)
if [[ "$libpath" == "" ]] ; then
    libpath="."
fi
java -Djava.library.path=${libpath}/lib/windows/i386 -Dfile.encoding=UTF-8 \
     -cp "${libpath};${libpath}/lib/SweetHome3D-5.6.jar;${libpath}/lib/j3dcore.jar;${libpath}/lib/j3dutils.jar;${libpath}/lib/vecmath.jar;${libpath}/lib/sunflow-0.07.3i.jar;${libpath}/lib/freehep-vectorgraphics-svg-2.1.1b.jar;${libpath}/exporter.jar" \
     com.eteks.sweethome3d.plugin.exporter.HouseExport \
     $*
