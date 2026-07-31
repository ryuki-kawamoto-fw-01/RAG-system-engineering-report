FROM mcr.microsoft.com/devcontainers/python:1-3.12-bullseye

RUN usermod -u 1000 vscode && groupmod -g 1000 vscode

ARG PROXY=${PROXY}
ENV http_proxy=${PROXY}
ENV https_proxy=${PROXY}
ENV HTTP_PROXY=${PROXY}
ENV HTTPS_PROXY=${PROXY}
ENV no_proxy="localhost,127.0.0.1"
ENV NO_PROXY="localhost,127.0.0.1"

USER vscode