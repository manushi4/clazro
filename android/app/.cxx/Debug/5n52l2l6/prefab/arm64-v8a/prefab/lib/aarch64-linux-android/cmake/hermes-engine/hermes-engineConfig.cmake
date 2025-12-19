if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "C:/Users/dnyan/.gradle/caches/9.0.0/transforms/ab95a681d1757658c6c3a9a3296bf131/transformed/jetified-hermes-android-0.80.2-debug/prefab/modules/libhermes/libs/android.arm64-v8a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/dnyan/.gradle/caches/9.0.0/transforms/ab95a681d1757658c6c3a9a3296bf131/transformed/jetified-hermes-android-0.80.2-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

