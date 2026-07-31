# To enable ssh & remote debugging on app service change the base image to the one below
FROM mcr.microsoft.com/azure-functions/python:4-python3.11

ARG _PROXY=http://umproxy.prx.intra.hitachi.co.jp:8080

ARG http_proxy=${_PROXY} \
    https_proxy=${_PROXY}

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true \
    FUNCTIONS_WORKER_RUNTIME=python \
    DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        -o Acquire::Retries=3 \
        -o Acquire::http::Timeout=120 \
        libreoffice \
        python3-uno \
        libreoffice-script-provider-python \
        fonts-noto-cjk \
        fonts-ipaexfont \
        fonts-vlgothic && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# libreoffice pth file to make sure python can find the uno module
RUN echo "/usr/lib/python3/dist-packages\n/usr/lib/libreoffice/program" \
    > /usr/local/lib/python3.11/site-packages/libreoffice.pth

COPY requirements.txt /
RUN pip install -r /requirements.txt

COPY . /home/site/wwwroot