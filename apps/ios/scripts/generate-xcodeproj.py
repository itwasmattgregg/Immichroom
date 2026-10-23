#!/usr/bin/env python3
"""Generate a minimal Immichroom.xcodeproj (no XcodeGen required)."""

from __future__ import annotations

import os
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "Immichroom.xcodeproj"
SWIFT_SOURCES = sorted((ROOT / "Immichroom").glob("*.swift"))
GEN_SWIFT = ROOT / "Generated" / "immichroom_ffi.swift"
ASSETS = ROOT / "Immichroom" / "Assets.xcassets"


def nid() -> str:
    return uuid.uuid4().hex[:24].upper()


def main() -> None:
    project_id = nid()
    target_id = nid()
    sources_phase = nid()
    frameworks_phase = nid()
    resources_phase = nid()
    project_config_list = nid()
    target_config_list = nid()
    debug_project = nid()
    release_project = nid()
    debug_target = nid()
    release_target = nid()
    main_group = nid()
    products_group = nid()
    sources_group = nid()
    gen_group = nid()
    frameworks_group = nid()
    product_ref = nid()
    xcframework_ref = nid()
    build_file_xc = nid()
    assets_ref = nid()
    assets_build = nid()

    file_entries: list[tuple[str, str, Path]] = []
    for path in SWIFT_SOURCES:
        file_entries.append((nid(), nid(), path))
    if GEN_SWIFT.exists():
        file_entries.append((nid(), nid(), GEN_SWIFT))

    # PBXBuildFile / PBXFileReference blocks for sources
    build_files = []
    file_refs = []
    source_group_children = []
    gen_group_children = []
    sources_phase_files = []
    resource_phase_files = []

    for build_id, ref_id, path in file_entries:
        name = path.name
        build_files.append(
            f'\t\t{build_id} /* {name} in Sources */ = {{isa = PBXBuildFile; fileRef = {ref_id} /* {name} */; }};'
        )
        file_refs.append(
            f'\t\t{ref_id} /* {name} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {name}; sourceTree = "<group>"; }};'
        )
        sources_phase_files.append(f'\t\t\t\t{build_id} /* {name} in Sources */,')
        if path.parent.name == "Generated":
            gen_group_children.append(f'\t\t\t\t{ref_id} /* {name} */,')
        else:
            source_group_children.append(f'\t\t\t\t{ref_id} /* {name} */,')

    if ASSETS.exists():
        build_files.append(
            f'\t\t{assets_build} /* Assets.xcassets in Resources */ = {{isa = PBXBuildFile; fileRef = {assets_ref} /* Assets.xcassets */; }};'
        )
        file_refs.append(
            f'\t\t{assets_ref} /* Assets.xcassets */ = {{isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = "<group>"; }};'
        )
        source_group_children.append(f'\t\t\t\t{assets_ref} /* Assets.xcassets */,')
        resource_phase_files.append(f'\t\t\t\t{assets_build} /* Assets.xcassets in Resources */,')

    build_files.append(
        f'\t\t{build_file_xc} /* ImmichroomFFI.xcframework in Frameworks */ = {{isa = PBXBuildFile; fileRef = {xcframework_ref} /* ImmichroomFFI.xcframework */; }};'
    )
    file_refs.append(
        f'\t\t{xcframework_ref} /* ImmichroomFFI.xcframework */ = {{isa = PBXFileReference; lastKnownFileType = wrapper.xcframework; name = ImmichroomFFI.xcframework; path = Rust/ImmichroomFFI.xcframework; sourceTree = "<group>"; }};'
    )
    file_refs.append(
        f'\t\t{product_ref} /* Immichroom.app */ = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = Immichroom.app; sourceTree = BUILT_PRODUCTS_DIR; }};'
    )

    pbx = f"""// !$*UTF8*$!
{{
	archiveVersion = 1;
	classes = {{
	}};
	objectVersion = 56;
	objects = {{

/* Begin PBXBuildFile section */
{chr(10).join(build_files)}
/* End PBXBuildFile section */

/* Begin PBXFileReference section */
{chr(10).join(file_refs)}
/* End PBXFileReference section */

/* Begin PBXFrameworksBuildPhase section */
		{frameworks_phase} /* Frameworks */ = {{
			isa = PBXFrameworksBuildPhase;
			buildActionMask = 2147483647;
			files = (
				{build_file_xc} /* ImmichroomFFI.xcframework in Frameworks */,
			);
			runOnlyForDeploymentPostprocessing = 0;
		}};
/* End PBXFrameworksBuildPhase section */

/* Begin PBXGroup section */
		{main_group} = {{
			isa = PBXGroup;
			children = (
				{sources_group} /* Immichroom */,
				{gen_group} /* Generated */,
				{frameworks_group} /* Frameworks */,
				{products_group} /* Products */,
			);
			sourceTree = "<group>";
		}};
		{products_group} /* Products */ = {{
			isa = PBXGroup;
			children = (
				{product_ref} /* Immichroom.app */,
			);
			name = Products;
			sourceTree = "<group>";
		}};
		{sources_group} /* Immichroom */ = {{
			isa = PBXGroup;
			children = (
{chr(10).join(source_group_children)}
			);
			path = Immichroom;
			sourceTree = "<group>";
		}};
		{gen_group} /* Generated */ = {{
			isa = PBXGroup;
			children = (
{chr(10).join(gen_group_children)}
			);
			path = Generated;
			sourceTree = "<group>";
		}};
		{frameworks_group} /* Frameworks */ = {{
			isa = PBXGroup;
			children = (
				{xcframework_ref} /* ImmichroomFFI.xcframework */,
			);
			name = Frameworks;
			sourceTree = "<group>";
		}};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
		{target_id} /* Immichroom */ = {{
			isa = PBXNativeTarget;
			buildConfigurationList = {target_config_list} /* Build configuration list for PBXNativeTarget "Immichroom" */;
			buildPhases = (
				{sources_phase} /* Sources */,
				{frameworks_phase} /* Frameworks */,
				{resources_phase} /* Resources */,
			);
			buildRules = (
			);
			dependencies = (
			);
			name = Immichroom;
			productName = Immichroom;
			productReference = {product_ref} /* Immichroom.app */;
			productType = "com.apple.product-type.application";
		}};
/* End PBXNativeTarget section */

/* Begin PBXProject section */
		{project_id} /* Project object */ = {{
			isa = PBXProject;
			attributes = {{
				BuildIndependentTargetsInParallel = 1;
				LastSwiftUpdateCheck = 1500;
				LastUpgradeCheck = 1500;
			}};
			buildConfigurationList = {project_config_list} /* Build configuration list for PBXProject "Immichroom" */;
			compatibilityVersion = "Xcode 14.0";
			developmentRegion = en;
			hasScannedForEncodings = 0;
			knownRegions = (
				en,
				Base,
			);
			mainGroup = {main_group};
			productRefGroup = {products_group} /* Products */;
			projectDirPath = "";
			projectRoot = "";
			targets = (
				{target_id} /* Immichroom */,
			);
		}};
/* End PBXProject section */

/* Begin PBXResourcesBuildPhase section */
		{resources_phase} /* Resources */ = {{
			isa = PBXResourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
{chr(10).join(resource_phase_files)}
			);
			runOnlyForDeploymentPostprocessing = 0;
		}};
/* End PBXResourcesBuildPhase section */

/* Begin PBXSourcesBuildPhase section */
		{sources_phase} /* Sources */ = {{
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
{chr(10).join(sources_phase_files)}
			);
			runOnlyForDeploymentPostprocessing = 0;
		}};
/* End PBXSourcesBuildPhase section */

/* Begin XCBuildConfiguration section */
		{debug_project} /* Debug */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				ALWAYS_SEARCH_USER_PATHS = NO;
				CLANG_ENABLE_MODULES = YES;
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = dwarf;
				ENABLE_TESTABILITY = YES;
				GCC_DYNAMIC_NO_PIC = NO;
				IPHONEOS_DEPLOYMENT_TARGET = 17.0;
				ONLY_ACTIVE_ARCH = YES;
				SDKROOT = iphoneos;
				SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;
				SWIFT_OPTIMIZATION_LEVEL = "-Onone";
			}};
			name = Debug;
		}};
		{release_project} /* Release */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				ALWAYS_SEARCH_USER_PATHS = NO;
				CLANG_ENABLE_MODULES = YES;
				COPY_PHASE_STRIP = NO;
				DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";
				IPHONEOS_DEPLOYMENT_TARGET = 17.0;
				SDKROOT = iphoneos;
				SWIFT_COMPILATION_MODE = wholemodule;
				VALIDATE_PRODUCT = YES;
			}};
			name = Release;
		}};
		{debug_target} /* Debug */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				DEVELOPMENT_TEAM = "";
				ENABLE_PREVIEWS = YES;
				GENERATE_INFOPLIST_FILE = YES;
				INFOPLIST_KEY_CFBundleDisplayName = IMMICHROOM;
				INFOPLIST_KEY_NSAppTransportSecurity_NSAllowsLocalNetworking = YES;
				INFOPLIST_KEY_NSLocalNetworkUsageDescription = "IMMICHROOM connects to your Immich server on the local network or Tailscale.";
				INFOPLIST_KEY_UIApplicationSceneManifest_Generation = YES;
				INFOPLIST_KEY_UILaunchScreen_Generation = YES;
				INFOPLIST_KEY_UISupportedInterfaceOrientations = UIInterfaceOrientationPortrait;
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
				);
				MARKETING_VERSION = 0.1.0;
				OTHER_LDFLAGS = (
					"-framework",
					SystemConfiguration,
					"-framework",
					Security,
				);
				PRODUCT_BUNDLE_IDENTIFIER = com.immichroom.app;
				PRODUCT_NAME = "$(TARGET_NAME)";
				SWIFT_EMIT_LOC_STRINGS = YES;
				SWIFT_VERSION = 5.0;
				TARGETED_DEVICE_FAMILY = "1,2";
			}};
			name = Debug;
		}};
		{release_target} /* Release */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{
				ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				DEVELOPMENT_TEAM = "";
				ENABLE_PREVIEWS = YES;
				GENERATE_INFOPLIST_FILE = YES;
				INFOPLIST_KEY_CFBundleDisplayName = IMMICHROOM;
				INFOPLIST_KEY_NSAppTransportSecurity_NSAllowsLocalNetworking = YES;
				INFOPLIST_KEY_NSLocalNetworkUsageDescription = "IMMICHROOM connects to your Immich server on the local network or Tailscale.";
				INFOPLIST_KEY_UIApplicationSceneManifest_Generation = YES;
				INFOPLIST_KEY_UILaunchScreen_Generation = YES;
				INFOPLIST_KEY_UISupportedInterfaceOrientations = UIInterfaceOrientationPortrait;
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
				);
				MARKETING_VERSION = 0.1.0;
				OTHER_LDFLAGS = (
					"-framework",
					SystemConfiguration,
					"-framework",
					Security,
				);
				PRODUCT_BUNDLE_IDENTIFIER = com.immichroom.app;
				PRODUCT_NAME = "$(TARGET_NAME)";
				SWIFT_EMIT_LOC_STRINGS = YES;
				SWIFT_VERSION = 5.0;
				TARGETED_DEVICE_FAMILY = "1,2";
			}};
			name = Release;
		}};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
		{project_config_list} /* Build configuration list for PBXProject "Immichroom" */ = {{
			isa = XCConfigurationList;
			buildConfigurations = (
				{debug_project} /* Debug */,
				{release_project} /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		}};
		{target_config_list} /* Build configuration list for PBXNativeTarget "Immichroom" */ = {{
			isa = XCConfigurationList;
			buildConfigurations = (
				{debug_target} /* Debug */,
				{release_target} /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		}};
/* End XCConfigurationList section */
	}};
	rootObject = {project_id} /* Project object */;
}}
"""

    PROJECT.mkdir(parents=True, exist_ok=True)
    (PROJECT / "project.pbxproj").write_text(pbx)
    workspace = PROJECT / "project.xcworkspace"
    workspace.mkdir(exist_ok=True)
    (workspace / "contents.xcworkspacedata").write_text(
        """<?xml version="1.0" encoding="UTF-8"?>
<Workspace
   version = "1.0">
   <FileRef
      location = "self:">
   </FileRef>
</Workspace>
"""
    )
    print(f"Wrote {PROJECT}")


if __name__ == "__main__":
    main()
