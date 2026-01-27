package be.oz.generative_art_world.adapter.controller;

import be.oz.generative_art_world.domain.FlowFieldType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class WorldMapper {

    public be.oz.generative_art_world.adapter.model.WorldDefinition toApi(
            be.oz.generative_art_world.domain.WorldDefinition domain) {

        be.oz.generative_art_world.adapter.model.WorldDefinition api =
                new be.oz.generative_art_world.adapter.model.WorldDefinition();

        api.setId(domain.getId());
        api.setSeed((int) domain.getSeed());
        api.setPalette(domain.getPalette().colors());
        api.setFlowFields(toApiFlowFields(domain.getFlowFields()));
        api.setGeometryFields(toApiGeometryFields(domain.getGeometryFields()));
        api.setAmbient(toApiAmbient(domain.getAmbientSettings()));
        api.setBounds(toApiBounds(domain.getBounds()));

        return api;
    }

    private List<be.oz.generative_art_world.adapter.model.FlowField> toApiFlowFields(
            List<be.oz.generative_art_world.domain.FlowField> domainFields) {
        return domainFields.stream()
                .map(this::toApiFlowField)
                .toList();
    }

    private be.oz.generative_art_world.adapter.model.FlowField toApiFlowField(
            be.oz.generative_art_world.domain.FlowField domain) {
        be.oz.generative_art_world.adapter.model.FlowField api =
                new be.oz.generative_art_world.adapter.model.FlowField();
        api.setType(toApiFlowFieldType(domain.type()));
        api.setScale(BigDecimal.valueOf(domain.scale()));
        api.setStrength(BigDecimal.valueOf(domain.strength()));
        return api;
    }

    private be.oz.generative_art_world.adapter.model.FlowField.TypeEnum toApiFlowFieldType(FlowFieldType type) {
        return switch (type) {
            case VECTOR_NOISE -> be.oz.generative_art_world.adapter.model.FlowField.TypeEnum.VECTOR_NOISE;
            case CURL_NOISE -> be.oz.generative_art_world.adapter.model.FlowField.TypeEnum.CURL_NOISE;
            case PERLIN_NOISE -> be.oz.generative_art_world.adapter.model.FlowField.TypeEnum.PERLIN_NOISE;
            case SIMPLEX_NOISE -> be.oz.generative_art_world.adapter.model.FlowField.TypeEnum.SIMPLEX_NOISE;
            case RANDOM -> be.oz.generative_art_world.adapter.model.FlowField.TypeEnum.RANDOM;
        };
    }

    private List<be.oz.generative_art_world.adapter.model.GeometryField> toApiGeometryFields(
            List<be.oz.generative_art_world.domain.GeometryField> domainFields) {
        return domainFields.stream()
                .map(this::toApiGeometryField)
                .toList();
    }

    private be.oz.generative_art_world.adapter.model.GeometryField toApiGeometryField(
            be.oz.generative_art_world.domain.GeometryField domain) {
        be.oz.generative_art_world.adapter.model.GeometryField api =
                new be.oz.generative_art_world.adapter.model.GeometryField();
        api.setType(domain.type());
        api.setDensity(BigDecimal.valueOf(domain.density()));
        api.setSize(BigDecimal.valueOf(domain.size()));
        return api;
    }

    private be.oz.generative_art_world.adapter.model.AmbientSettings toApiAmbient(
            be.oz.generative_art_world.domain.AmbientSettings domain) {
        be.oz.generative_art_world.adapter.model.AmbientSettings api =
                new be.oz.generative_art_world.adapter.model.AmbientSettings();
        api.setLightIntensity(BigDecimal.valueOf(domain.lightIntensity()));
        api.setFogDensity(BigDecimal.valueOf(domain.fogDensity()));
        api.setMotionNoise(BigDecimal.valueOf(domain.motionNoise()));
        return api;
    }

    private be.oz.generative_art_world.adapter.model.WorldBounds toApiBounds(
            be.oz.generative_art_world.domain.WorldBounds domain) {
        be.oz.generative_art_world.adapter.model.WorldBounds api =
                new be.oz.generative_art_world.adapter.model.WorldBounds();
        api.setX(BigDecimal.valueOf(domain.x()));
        api.setY(BigDecimal.valueOf(domain.y()));
        api.setZ(BigDecimal.valueOf(domain.z()));
        return api;
    }
}

