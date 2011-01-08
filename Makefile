ID = mimis
GROUP_ID = "org.dhappy.$(ID)"
MIMIS_HOME = .$(ID)
KEYSTORE = $(MIMIS_HOME)/jar/keystore
STOREPASS = storepass

KEYPATH = $(dir $(KEYSTORE))

compile:
	mvn cocoon:prepare

$(KEYSTORE):
	mkdir -p $(KEYPATH)
	keytool -genkey \
	        -keystore $@ \
	        -alias $(ID) \
	        -storepass '$(STOREPASS)' \
	        -dname 'OU=Mimis ,O=Department of Happiness ,L=Baltimore ,S=Maryland ,C=US'

sign: $(KEYSTORE)
	jarsigner -keystore $< \
                  -storepass storepass -keypass storepass \
		  target/*.jar \
		  mimis
#	mvn exec:exec -D sign
#	mvn jarsigner:sign

shell:
	mvn exec:java -Dexec.mainClass="org.neo4j.shell.StartClient" -Dexec.args="-path var/mimis"

chatbot:
	mvn exec:java -Dexec.mainClass="org.dhappy.mimis.Mimis"

loadfile:
	mvn exec:java -Dexec.mainClass="org.dhappy.mimis.FileLoader"

neotest:
	mvn exec:java -Dexec.mainClass="org.dhappy.test.NeoTraverse"

block:
	mvn org.apache.maven.plugins:maven-archetype-plugin:1.0-alpha-7:create \
		-DarchetypeGroupId=org.apache.cocoon.archetype-block \
		-DarchetypeArtifactId=cocoon-archetype-block \
		-DarchetypeVersion=3.0.0-alpha-2 \
		-DgroupId=$(GROUP_ID) \
		-DartifactId=cocoon

webapp:
	mvn org.apache.maven.plugins:maven-archetype-plugin:1.0-alpha-7:create \
		-DarchetypeGroupId=org.apache.cocoon.archetype-webapp \
		-DarchetypeArtifactId=cocoon-archetype-webapp \
		-DarchetypeVersion=3.0.0-alpha-2 \
		-DgroupId=$(GROUP_ID) \
		-DartifactId=servlet

parent:
	mvn org.apache.maven.plugins:maven-archetype-plugin:1.0-alpha-7:create \
		-DarchetypeGroupId=org.apache.cocoon.archetype-parent \
		-DarchetypeArtifactId=cocoon-archetype-parent \
		-DarchetypeVersion=3.0.0-alpha-2 \
		-DgroupId=$(GROUP_ID) \
		-DartifactId=parent
