package be.oz.generative_art_world.adapter.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class WorldControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldCreateWorldWithNoBody() throws Exception {
        // Given / When
        MvcResult result = mockMvc.perform(post("/world")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.seed").exists())
                .andExpect(jsonPath("$.palette").isArray())
                .andReturn();

        // Then
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(body.get("id").asText()).isNotBlank();
        assertThat(body.get("palette").size()).isGreaterThan(0);
    }

    @Test
    void shouldCreateWorldWithProvidedSeed() throws Exception {
        // Given
        long seed = 123456789L;
        String requestBody = "{\"seed\":" + seed + "}";

        // When
        MvcResult result = mockMvc.perform(post("/world")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andReturn();

        // Then
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(body.get("seed").asLong()).isEqualTo(seed);
    }

    @Test
    void shouldCreateWorldWithFlowLinesPattern() throws Exception {
        // Given
        String requestBody = "{\"patternType\":\"FLOW_LINES\"}";

        // When
        MvcResult result = mockMvc.perform(post("/world")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.pattern").exists())
                .andReturn();

        // Then
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        JsonNode pattern = body.get("pattern");
        assertThat(pattern).isNotNull();
        assertThat(pattern.isNull()).isFalse();
        assertThat(pattern.get("type").asText()).isEqualTo("FLOW_LINES");
    }

    @Test
    void shouldReturn404ForUnknownWorldId() throws Exception {
        // Given
        UUID unknownId = UUID.randomUUID();

        // When / Then
        mockMvc.perform(get("/world/{id}", unknownId))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnListOfWorlds() throws Exception {
        // Given - create at least one world
        mockMvc.perform(post("/world")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated());

        // When / Then
        mockMvc.perform(get("/world"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}
