#!/bin/bash

BASH_ENV=${HOME}/.bash_env
touch ${BASH_ENV}
echo export BASH_ENV=\"${BASH_ENV}\" >> ~/.bashrc
echo '. \"\${BASH_ENV}\"' >> ~/.bashrc
curl -o- -L https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh
curl -o- -L https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh > nvm_install.sh
chmod a+x nvm_install.sh
PROFILE=${BASH_ENV} ./nvm_install.sh
ls -la ~
pwd
echo cat $BASH_ENV ~/.bashrc nvm_install.sh
cat $BASH_ENV ~/.bashrc nvm_install.sh
source $BASH_ENV
echo node > .nvmrc
ls -la
nvm install
