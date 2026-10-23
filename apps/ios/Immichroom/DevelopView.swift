import SwiftUI
import UIKit

struct DevelopView: View {
    @EnvironmentObject private var model: AppModel
    let asset: AssetInfo

    @State private var sourceJPEG: Data?
    @State private var preview: UIImage?
    @State private var recipeJSON: String = emptyRecipeJson()
    @State private var isWorking = false
    @State private var banner: String?
    @State private var appear = false

    var body: some View {
        VStack(spacing: 0) {
            ZStack {
                Color.black
                if let preview {
                    Image(uiImage: preview)
                        .resizable()
                        .scaledToFit()
                        .opacity(appear ? 1 : 0)
                        .scaleEffect(appear ? 1 : 1.02)
                } else {
                    ProgressView().tint(IRTheme.muted)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            VStack(spacing: 12) {
                if let banner {
                    Text(banner)
                        .font(.caption)
                        .foregroundStyle(IRTheme.muted)
                }

                HStack(spacing: 10) {
                    lookButton("Auto") { applyAuto() }
                    lookButton("Tri-X Warm") { applyTriX() }
                    lookButton("Reset") { resetLook() }
                }

                HStack(spacing: 10) {
                    Button("Save") { save() }
                        .buttonStyle(IRSecondaryButton())
                    Button("Clear saved") { clearSaved() }
                        .buttonStyle(IRSecondaryButton())
                }
            }
            .padding(16)
            .background(IRTheme.bgTop.opacity(0.96))
        }
        .navigationTitle(asset.originalFileName.isEmpty ? "Develop" : asset.originalFileName)
        .navigationBarTitleDisplayMode(.inline)
        .disabled(isWorking)
        .task {
            await loadSource()
        }
    }

    private func lookButton(_ title: String, action: @escaping () -> Void) -> some View {
        Button(title, action: action)
            .font(.subheadline.weight(.semibold))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(IRTheme.accent.opacity(0.92))
            .foregroundStyle(IRTheme.bgTop)
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    private func loadSource() async {
        isWorking = true
        defer { isWorking = false }
        do {
            let data = try model.previewJPEG(for: asset.id)
            sourceJPEG = data
            if let saved = try model.loadRecipe(assetId: asset.id) {
                recipeJSON = saved
                banner = "Loaded saved EditRecipe"
            } else {
                recipeJSON = emptyRecipeJson()
            }
            await bake()
            withAnimation(.easeOut(duration: 0.45)) { appear = true }
        } catch {
            banner = error.localizedDescription
        }
    }

    private func applyAuto() {
        guard let sourceJPEG else { return }
        isWorking = true
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                let json = try autoToneFromJpeg(jpeg: sourceJPEG, strength: 1.0)
                DispatchQueue.main.async {
                    recipeJSON = json
                    banner = "Auto Tone"
                    Task { await bake(); isWorking = false }
                }
            } catch {
                DispatchQueue.main.async {
                    banner = error.localizedDescription
                    isWorking = false
                }
            }
        }
    }

    private func applyTriX() {
        recipeJSON = triXWarmRecipeJson()
        banner = "Tri-X Warm"
        Task { await bake() }
    }

    private func resetLook() {
        recipeJSON = emptyRecipeJson()
        banner = "Reset"
        Task { await bake() }
    }

    private func bake() async {
        guard let sourceJPEG else { return }
        isWorking = true
        defer { isWorking = false }
        let jpeg = sourceJPEG
        let recipe = recipeJSON
        let baked: Data? = await withCheckedContinuation { cont in
            DispatchQueue.global(qos: .userInitiated).async {
                cont.resume(returning: try? bakePreviewJpeg(jpeg: jpeg, recipeJson: recipe, maxEdge: 1600))
            }
        }
        if let baked, let ui = UIImage(data: baked) {
            withAnimation(.easeInOut(duration: 0.25)) {
                preview = ui
            }
        }
    }

    private func save() {
        do {
            try model.saveRecipe(assetId: asset.id, recipeJSON: recipeJSON)
            banner = "Saved to Immich (immichroom)"
        } catch {
            banner = error.localizedDescription
        }
    }

    private func clearSaved() {
        do {
            try model.clearRecipe(assetId: asset.id)
            recipeJSON = emptyRecipeJson()
            banner = "Cleared saved recipe"
            Task { await bake() }
        } catch {
            banner = error.localizedDescription
        }
    }
}

struct IRSecondaryButton: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.subheadline.weight(.medium))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(Color.white.opacity(configuration.isPressed ? 0.12 : 0.08))
            .foregroundStyle(IRTheme.ink)
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}
