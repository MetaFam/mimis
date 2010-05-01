#!/bin/bash

DATEFMT="%Y-%m-%d@%H:%M:%S.%N"
AUTHOR="Will Holcomb <mimis@dhappy.org>"

GITSRC="git://github.com/wholcomb/mimis.git"

APT[${#APT[*]}]=emacs-snapshot
APT[${#APT[*]}]=git-core
APT[${#APT[*]}]=flashplugin-installer

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
    sudo ln -sf "$(basename ${SRC})" "${KEY}"
    echo "${KEY}"
}

function clear() {
    KEY="$1"

    KEY="$(echo "${KEY}" | sed -e 's|\.\?[0-9]*\.\?\([0-9]\{2\}-\?\)\+@*\([0-9]\{2\}:\?\)\+\.\?[0-9]*$||')"
    echo "${KEY}"

    ls "${KEY}.$(date +"%Y")-"* | tac | (
	while IFS= read -r FILE; do
	    # echo "$FILE : $NEXT"
	    [[ -e "${NEXT}" && -e "${FILE}" ]] && (
		# diff "${FILE}" "${NEXT}" || (
		diff "${FILE}" "${NEXT}" > /dev/null && (
		    # echo sudo rm -f "${NEXT}"
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

sudo add-apt-repository ppa:chromium-daily/ppa

APT[${#APT[*]}]=apache2
APT[${#APT[*]}]=chromium-browser
APT[${#APT[*]}]=chromium-codecs-ffmpeg
APT[${#APT[*]}]=sun-java6-jdk
APT[${#APT[*]}]=maven2

CMD="apt-get install"
for PKG in "${APT[*]}"; do CMD="${CMD} ${PKG}"; done
echo "# ${CMD}"
sudo ${CMD}         # This should rarely happen

cd ~

GITDEST="mimis"
DESTPATH="${GITDEST}.$(date +"${DATEFMT}")"
[ -e "${GITDEST}" ] || (
    git clone "${GITSRC}" "${DESTPATH}"
    ln -s "${GITDEST}" "${DESTPATH}"
)

PUBHTML=public_html
[ -e "${PUBHTML}" ] || (
    ln -s "${GITDEST}" "${PUBHTML}"
)

[ -e "${PUBHTML}/..." ] || (
    ln -s "${GITDEST}/..." "${PUBHTML}/..."
)

LOADUSER="/etc/apache2/mods-enabled/userdir.load"
[ -e "${LOADUSER}" ] || (
    sudo ln -s "../mods-available/$(basename ${LOADUSER})" "${LOADUSER}"
    USERCONF="${LOADUSER%.*}.conf"
    sudo ln -s "../mods-available/$(basename ${USERCONF})" "${USERCONF}"

    sudo /etc/init.d/apache2 reload
)

google-chrome "http://localhost/~${USER}/.../" &
