
/*
 * AI BUILDER PRO
 * Template Engine
 * Supports existing Firestore templates
 */

const TemplateEngine = (() => {

    // Normalize text for matching
    function normalize(value) {
        return String(value ?? "")
            .toLowerCase()
            .replace(/[أإآ]/g, "ا")
            .replace(/ة/g, "ه")
            .replace(/ى/g, "ي")
            .replace(/[^\p{L}\p{N}_]+/gu, " ")
            .trim();
    }

    // Convert text into words
    function tokenize(value) {
        return normalize(value)
            .split(/\s+/)
            .filter(Boolean);
    }

    // Validate programming identifiers
    function validIdentifier(value) {
        return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value);
    }

    // Clean and normalize field names
    function cleanField(value) {
        let field = String(value ?? "")
            .trim()
            .replace(/[`"'[\]{}]/g, "")
            .replace(/[^\p{L}\p{N}_$]/gu, "_");

        if (!field) return "";

        if (!/^[\p{L}_$]/u.test(field)) {
            field = "_" + field;
        }

        return field;
    }

    // Remove duplicated fields
    function uniqueFields(fields) {
        const result = [];
        const seen = new Set();

        for (const item of fields) {
            const field = cleanField(item);

            if (!field) continue;

            const key = field.toLowerCase();

            if (!seen.has(key)) {
                seen.add(key);
                result.push(field);
            }
        }

        return result;
    }

    // Extract fields from explicit field declarations
    function extractExplicitFields(prompt) {
        const patterns = [
            /(?:fields?|columns?|الحقول|الأعمدة)\s*[:：]\s*([^\n]+)/gi,
            /(?:اسماء الحقول|أسماء الحقول)\s*[:：]\s*([^\n]+)/gi
        ];

        const fields = [];

        for (const pattern of patterns) {
            let match;

            while ((match = pattern.exec(prompt)) !== null) {
                const values = match[1]
                    .split(/[,،;|\n]+/)
                    .map(item => item.trim());

                fields.push(...values);
            }
        }

        return fields;
    }

    // Extract fields from common SQL-like declarations
    function extractLeadingFields(prompt) {
        const fields = [];

        const patterns = [
            /(?:with|using|include|including)\s+([\w$,\s]+?)(?=\s+(?:fields?|columns?|in|into|from|table|database)\b|$)/gi,
            /(?:حقول|أعمدة)\s+([\p{L}\p{N}_$,\s،]+?)(?=\s+(?:في|داخل|لجدول|للجدول)|$)/giu
        ];

        for (const pattern of patterns) {
            let match;

            while ((match = pattern.exec(prompt)) !== null) {
                const values = match[1].split(/[,،;|\s]+/);
                fields.push(...values);
            }
        }

        return fields;
    }

    // Extract fields from the user's request
    function extractFields(prompt, defaultFields = []) {

        const text = String(prompt ?? "");

        const explicit = extractExplicitFields(text);
        const leading = extractLeadingFields(text);

        const combined = [
            ...defaultFields,
            ...explicit,
            ...leading
        ];

        return uniqueFields(combined);
    }

    // Score template according to the user's request
    function scoreTemplate(prompt, template) {

        const requestWords = tokenize(prompt);

        const templateWords = tokenize([
            template.title,
            template.language,
            template.description,
            ...(template.keywords || [])
        ].join(" "));

        if (!requestWords.length || !templateWords.length) {
            return 0;
        }

        const uniqueRequestWords = [...new Set(requestWords)];

        let score = 0;

        for (const word of uniqueRequestWords) {
            if (templateWords.includes(word)) {
                score += 1;
            }
        }

        return score / uniqueRequestWords.length;
    }

    // Find the most suitable template
    function findBestTemplate(prompt, templates) {

        if (!Array.isArray(templates) || !templates.length) {
            return null;
        }

        let bestTemplate = null;
        let bestScore = 0;

        for (const template of templates) {

            const score = scoreTemplate(prompt, template);

            if (score > bestScore) {
                bestScore = score;
                bestTemplate = {
                    ...template,
                    matchScore: score
                };
            }
        }

        return bestTemplate;
    }

    // Render a template
    function renderTemplate(template, fields = []) {

        let output = String(template ?? "");

        const safeFields = uniqueFields(fields);

        // Process repeated fields section
        const fieldsPattern =
            /\{\{#fields\}\}([\s\S]*?)\{\{\/fields\}\}/g;

        output = output.replace(
            fieldsPattern,
            (fullMatch, section) => {

                return safeFields.map((field, index) => {

                    let item = section;

                    item = item.replace(/\{\{field\}\}/g, field);

                    item = item.replace(
                        /\{\{index\}\}/g,
                        String(index)
                    );

                    item = item.replace(
                        /\{\{comma\}\}/g,
                        index < safeFields.length - 1 ? "," : ""
                    );

                    return item;

                }).join("");
            }
        );

        // Replace global field variables
        output = output.replace(
            /\{\{FIELDS_CSV\}\}/g,
            safeFields.join(", ")
        );

        output = output.replace(
            /\{\{FIELDS_QUOTED\}\}/g,
            safeFields.map(field => `"${field}"`).join(", ")
        );

        // Replace remaining simple variables
        output = output.replace(
            /\{\{field\}\}/g,
            safeFields[0] || ""
        );

        return output;
    }

    // Generate complete output
    function generate(template, prompt, additionalFields = []) {

        if (!template || !template.template) {
            throw new Error("القالب غير صالح أو لا يحتوي على كود.");
        }

        const defaultFields = Array.isArray(template.defaultFields)
            ? template.defaultFields
            : [];

        const fields = extractFields(
            prompt,
            [...defaultFields, ...additionalFields]
        );

        const code = renderTemplate(
            template.template,
            fields
        );

        return {
            title: template.title || "قالب بدون عنوان",
            language: template.language || "text",
            description: template.description || "",
            fields,
            code,
            matchScore: template.matchScore || 0
        };
    }

    return {
        normalize,
        tokenize,
        validIdentifier,
        cleanField,
        uniqueFields,
        extractExplicitFields,
        extractLeadingFields,
        extractFields,
        scoreTemplate,
        findBestTemplate,
        renderTemplate,
        generate
    };

})();

// Export for HTML modules
export default TemplateEngine;
export {
    TemplateEngine
};


