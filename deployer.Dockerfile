# The base image has the deployer tool that uploads files to object storage for certain environment/region.
# source: https://bitbucket.oci.oraclecorp.com/projects/LOOM/repos/loom-infrastructure/browse/packages/plugin-deployer
# To build your own image (They are done in Teamcity PR merge job)
#   1) `yarn build` to make sure your plugin build is in `build/`
#   2) `docker build oci-console-plugin-<plugin-name>-deployer .`
FROM odo-docker-local.artifactory.oci.oraclecorp.com/oci-console-plugin-deployer-base:1.15.0
 
 
COPY build/ /etc/assets/