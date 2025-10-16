"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function AdminApiDocsPage() {
    return (
        <div className="h-full overflow-auto bg-background">
            <SwaggerUI
                url="/api/v1/openapi"
                docExpansion="none"
                defaultModelsExpandDepth={0}
                defaultModelRendering="model"
            />
        </div>
    );
}
