#!/bin/bash

SOURCES_LIST=/etc/apt/sources.list
DATEFMT="%Y-%m-%d@%H:%M:%S.%N"
AUTHOR="Will Holcomb <mimis@dhappy.org>"

GITSRC="git://github.com/wholcomb/mimis.git"
GITDEST="public_html"

APT[${#APT[*]}]=emacs-snapshot
APT[${#APT[*]}]=git-core
APT[${#APT[*]}]=flashplugin-installer

SRC="${SOURCES_LIST}"
GOOGLE_REPO=http://dl.google.com/linux/deb/

# Get a source for input
function getImmutable() {
    KEY="$1"
    
    # If the key doesn't exist
    [ -e "${KEY}" ] || (
        # Create it
	sudo touch "${KEY}"
    )

    # If the key is a normal file
    [ -L "${KEY}" ] || (
	# Convert it to a timestamped value

        # Timestamped name - assumed to be collision free
	STAMP="${KEY}.$(date +"${DATEFMT}")"
	sudo cp -a "${KEY}" "${STAMP}"
	sudo ln -fs  "${STAMP}" "${KEY}"
    )

    # Create a read link to the source
    STAMP="${KEY}.$(date +"${DATEFMT}")"
    sudo ln -s "$(readlink -f "${KEY}")" "${STAMP}"
    echo "${STAMP}"
}

# Save state before overwriting
function getMutable() {
    KEY="$1"

    [ -e "${KEY}" ] && (
	STAMP="${KEY}.$(date +"${DATEFMT}")"
	sudo cp -a "${KEY}" "${STAMP}"
    )
    STAMP="${KEY}.$(date +"${DATEFMT}")"
    [ -e "${KEY}" ] && (
	sudo cp "${KEY}" "${STAMP}"
    ) || (
	sudo touch "${STAMP}"
    )
    echo "${STAMP}"
}

function commit() {
    SRC="$1"

    # Leading \d* for local frame offset
    #FILE="${SRC/\d*\.?(\d{2}-?){3}[ @]+(\d{2}:?){3}\.?\d*$//}
    KEY="$(echo "${SRC}" | sed -e 's|\.\?[0-9]*\.\?\([0-9]\{2\}-\?\)\+@*\([0-9]\{2\}:\?\)\+\.\?[0-9]*$||')"

    [ -e "${KEY}" ] && (
	STAMP="${KEY}.$(date +"${DATEFMT}")"
	sudo cp -a "${KEY}" "${STAMP}"
    )
    sudo ln -sf "$(basename ${SRC})" "$(basename ${KEY})"
    echo "${KEY}"
}

function clear() {
    KEY="$1"

    KEY="$(echo "${KEY}" | sed -e 's|\.\?[0-9]*\.\?\([0-9]\{2\}-\?\)\+@*\([0-9]\{2\}:\?\)\+\.\?[0-9]*$||')"
    echo "${KEY}"

    ls "${KEY}.$(date +"%Y")-"* | tac | (
	while IFS= read -r FILE; do
	    echo "$FILE : $NEXT"
	    [[ -e "${NEXT}" && -e "${FILE}" ]] && (
		# diff "${FILE}" "${NEXT}" || (
		diff "${FILE}" "${NEXT}" > /dev/null && (
		    echo sudo rm -f "${NEXT}"
		    sudo rm -f "${NEXT}"
		)
	    )
	    NEXT="${FILE}"
	done
    )
    echo "${KEY}"
}

function fini() {
    echo -n
}

SRC="/etc/apt/sources.list.d/google-chrome.list"
[ -e "${SRC}" ] || (
    OUT="$(getMutable ${SRC})"
    echo "OUT: ${OUT}"

    sudo bash -c "eval cat >> ${OUT} << EOF
# Add: Google Chrome Home Repository
#   By: ${AUTHOR}
#

deb ${GOOGLE_REPO} stable non-free main
EOF"

    commit "${OUT}"

    KEY="${KEY:=https://dl-ssl.google.com/linux/linux_signing_key.pub}"
    echo "Key: ${KEY}";
    wget -q -O – "${KEY}" | sudo apt-key add -
    
    sudo apt-get update
)

APT[${#APT[*]}]=apache2
APT[${#APT[*]}]=google-chrome-unstable

CMD="apt-get install"
for PKG in "${APT[*]}"; do CMD="${CMD} ${PKG}"; done
echo "# ${CMD}"
#sudo bash -c "eval $CMD" # This should rarely happen

git clone "${GITSRC}" ~"/${GITDEST}"

HOSTFILE="${HOSTFILE:=/etc/apache2/sites-enabled/000-default}"
MIMSHOST="${HOSTFILE}.mimis"
[ -e "${MIMSHOST}" ] || (
    IN="$(getImmutable "${HOSTFILE}")"
    OUT="$(getMutable "${HOSTFILE}")"

    DOCROOT="$(awk '/DocumentRoot/ { print $2 }' "${IN}")"
    NEWROOT="${HOME}/.../"

    sudo bash -c "eval cat > \"${OUT}\" << EOF
# Edit: Change default web directory
#   By: ${AUTHOR}

EOF"
    sudo bash -c "cat \"${IN}\" | sed -e 's| \+${DOCROOT}/\?| ${NEWROOT}|' >> \"${OUT}\""
    commit "${OUT}"
    clear "${HOSTFILE}"

    sudo /etc/init.d/apache2 reload
)

# #google-chrome http://localhost