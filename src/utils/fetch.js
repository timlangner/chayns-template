import logger from 'chayns-logger';
import SERVER_URL from '../constants/server-url';

const defaultSetting = {
    disableWaitCursor: false,
    auth: true,
    backend: true,
    actionName: '',
    logData: {},
    logWarningStatusCodes: [],
    errorJsonStatusCodes: [],
    infoLog: true,
};

export default async function fetchDataFromApi(
    method,
    body,
    route,
    convertToJson,
    setting,
    serverUrl = SERVER_URL
) {
    const settings = setting || defaultSetting;

    const header = {
        CacheControl: 'no-cache',
        Pragma: 'no-cache',
    };
    if (chayns.env.user.isAuthenticated && settings.auth === true) {
        header.Authorization = `bearer ${chayns.env.user.tobitAccessToken}`;
    }
    const sentData = {
        headers: header,
        method: method.toUpperCase(),
    };
    if (body) {
        header['Content-Type'] = 'application/json';
        sentData.body = JSON.stringify(body);
    }
    const url = settings.backend === false ? route : serverUrl + route;
    if (!settings.disableWaitCursor) {
        chayns.showWaitCursor();
    }
    let returnData = null;
    let reqGuid;
    await fetch(url, sentData)
        .then(async (response) => {
            reqGuid =
                response &&
                response.headers &&
                response.headers.get('X-Request-Id');
            try {
                let jsonResult = null;
                if (
                    response.status === 200 ||
                    response.status === 201 ||
                    response.status === 202
                ) {
                    if (convertToJson) {
                        jsonResult = await response.json();
                    }
                } else if (response.status === 401 || response.status === 403) {
                    if (response.status === 401) {
                        chayns.login();
                    } else if (response.status === 403) {
                        chayns.refreshAccessToken();
                    }
                    logger.error({
                        message: `Unauthorized or Forbidden at ${settings.actionName}`,
                        sessionUid: reqGuid,
                        data: {
                            Status: response.status,
                            Request: `${method} ${url}`,
                            tokenPayload: chayns.utils.getJwtPayload(
                                chayns.env.user.tobitAccessToken
                            ),
                            body: body || null,
                            ...settings.logData,
                        },
                    });
                } else {
                    if (
                        settings.errorJsonStatusCodes &&
                        settings.errorJsonStatusCodes.length > 0
                    ) {
                        if (
                            settings.errorJsonStatusCodes.find(
                                (code) => code === response.status
                            )
                        ) {
                            jsonResult = await response.json();
                        }
                    }
                    let logError = true;
                    if (
                        settings.logWarningStatusCodes &&
                        settings.logWarningStatusCodes.length > 0
                    ) {
                        if (
                            settings.logWarningStatusCodes.find(
                                (code) => code === response.status
                            )
                        ) {
                            logError = false;
                        }
                    }
                    if (logError) {
                        logger.error({
                            message: `failed ${settings.actionName}`,
                            sessionUid: reqGuid,
                            data: {
                                Status: response.status,
                                Request: `${method} ${url}`,
                                body: body || null,
                                ...settings.logData,
                            },
                        });
                    } else {
                        logger.warning({
                            message: `failed ${settings.actionName}`,
                            sessionUid: reqGuid,
                            data: {
                                Status: response.status,
                                Request: `${method} ${url}`,
                                body: body || null,
                                ...settings.logData,
                            },
                        });
                    }
                }
                if (!settings.disableWaitCursor) {
                    chayns.hideWaitCursor();
                }
                returnData = {
                    status: response.status,
                    json: jsonResult,
                };
            } catch (ex) {
                if (!settings.disableWaitCursor) {
                    chayns.hideWaitCursor();
                }
                if (
                    ex.message === 'Abgebrochen' ||
                    ex.message === 'cancelled'
                ) {
                    logger.warning(
                        {
                            message: `unexpected Error at ${settings.actionName}`,
                            sessionUid: reqGuid,
                            data: {
                                Request: `${method} ${
                                    settings.backend === false
                                        ? route
                                        : serverUrl + route
                                }`,
                                body: body || null,
                                ...settings.logData,
                            },
                        },
                        ex
                    );
                } else {
                    logger.error(
                        {
                            message: `unexpected Error at ${settings.actionName}`,
                            sessionUid: reqGuid,
                            data: {
                                Request: `${method} ${
                                    settings.backend === false
                                        ? route
                                        : serverUrl + route
                                }`,
                                body: body || null,
                                ...settings.logData,
                            },
                        },
                        ex
                    );
                }
            }
        })
        .catch((ex) => {
            if (!settings.disableWaitCursor) {
                chayns.hideWaitCursor();
            }
            if (ex.message === 'Abgebrochen' || ex.message === 'cancelled') {
                logger.warning(
                    {
                        message: `unexpected Error at ${settings.actionName}`,
                        sessionUid: reqGuid,
                        data: {
                            Request: `${method} ${
                                settings.backend === false
                                    ? route
                                    : serverUrl + route
                            }`,
                            body: body || null,
                            ...settings.logData,
                        },
                    },
                    ex
                );
            } else {
                logger.error(
                    {
                        message: `unexpected Error at ${settings.actionName}`,
                        sessionUid: reqGuid,
                        data: {
                            Request: `${method} ${
                                settings.backend === false
                                    ? route
                                    : serverUrl + route
                            }`,
                            body: body || null,
                            ...settings.logData,
                        },
                    },
                    ex
                );
            }
        });

    if (settings.infoLog !== false) {
        logger.info({
            message: `Fetch ${settings.actionName}`,
            sessionUid: reqGuid,
            data: {
                Request: `${method} ${
                    settings.backend === false ? route : serverUrl + route
                }`,
                body: body || null,
                ...settings.logData,
            },
        });
    }
    return returnData;
}
