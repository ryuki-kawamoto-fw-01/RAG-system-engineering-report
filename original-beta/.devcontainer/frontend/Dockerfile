FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm

RUN usermod -u 1000 node && groupmod -g 1000 node

ARG PROXY=${PROXY}
ENV http_proxy=${PROXY}
ENV https_proxy=${PROXY}
ENV HTTP_PROXY=${PROXY}
ENV HTTPS_PROXY=${PROXY}

# Install Azure CLI
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

USER node