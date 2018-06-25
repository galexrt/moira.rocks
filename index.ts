// Copyright 2019, Alexander Trost. All rights reserved.

import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

let config = new pulumi.Config();

let appLabels = { "app.kubernetes.io/name": "moiraRocks" };
let appDeployment = new k8s.apps.v1.Deployment("moira-rocks", {
    metadata: {
        namespace: "moira-live-proj-homepage",
        labels: appLabels,
    },
    spec: {
        selector: { matchLabels: appLabels },
        replicas: config.getNumber("replicas") || 2,
        template: {
            metadata: { labels: appLabels },
            spec: {
                containers: [
                    {
                        name: "app",
                        image: "galexrt/moira-rocks:v0.0.1",
                        ports: [
                            {
                                containerPort: 80,
                            },
                        ],
                        imagePullPolicy: "Always",
                        livenessProbe: {
                            httpGet: {
                                path: "/index.html",
                                port: 80,
                            },
                            initialDelaySeconds: 3,
                            timeoutSeconds: 2,
                        },
                        readinessProbe: {
                            httpGet: {
                                path: "/index.html",
                                port: 80,
                            },
                            initialDelaySeconds: 3,
                            timeoutSeconds: 2,
                        },
                    },
                ],
            },
        },
    },
});

let appService = new k8s.core.v1.Service("moira-rocks", {
    metadata: {
        labels: appDeployment.spec.template.metadata.labels,
        namespace: "moira-live-proj-homepage",
    },
    spec: {
        type: "ClusterIP",
        ports: [
            {
                name: "http",
                port: 80,
                targetPort: 80,
                protocol: "TCP",
            },
        ],
        selector: appLabels,
    }
})

let appIngress = new k8s.extensions.v1beta1.Ingress("moira-rocks", {
    metadata: {
        annotations: {
            "pulumi.com/skipAwait": "true",
        },
        labels: appDeployment.spec.template.metadata.labels,
        namespace: "moira-live-proj-homepage",
    },
    spec: {
        tls: [
            {
                hosts: [
                    "moira.rocks",
                ],
                secretName: "tls-wildcard-edenmal-net",

            },
        ],
        rules: [
            {
                host: "moira.rocks",
                http: {
                    paths: [
                        {
                            path: "/",
                            backend: {
                                serviceName: appService.metadata.name,
                                servicePort: 80,
                            },
                        },
                    ],
                },
            },
        ],
    },
})

export let moiraRocks = appDeployment.metadata.name;
