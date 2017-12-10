BASEPATH=${1:-data}

BASEFILE=$(pwd)/update-data.log
UPLOADCMD="c:/Python34/python upload-qiniu.py --path=${BASEPATH}"

filenames=$(cd ${BASEPATH}; find organizations/ -iregex ".*\.\(jpg\|json\|obj\|jpeg\|png\|mtl\|sh3d\|svg\)" -anewer ${BASEFILE})
if [[ "${filename}" == "" ]] ; then
    echo "没有文件需要上传"
else
    echo "上传下列文件:"
    echo "${filenames}"
    PYTHONIOENCODING=UTF-8 ${UPLOADCMD} ${filenames}
    echo -e "Upload the following files at $(date)\n${filenames}" > ${BASEFILE}
fi
