import SwiftUI
import UIKit

struct LibraryView: View {
    @EnvironmentObject private var model: AppModel
    private let columns = [
        GridItem(.flexible(), spacing: 3),
        GridItem(.flexible(), spacing: 3),
        GridItem(.flexible(), spacing: 3),
    ]

    var body: some View {
        ScrollView {
            LazyVGrid(columns: columns, spacing: 3) {
                ForEach(model.assets, id: \.id) { asset in
                    NavigationLink {
                        DevelopView(asset: asset)
                    } label: {
                        AssetThumb(assetId: asset.id)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .navigationTitle("IMMICHROOM")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    model.refreshLibrary()
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .disabled(model.isBusy)
            }
        }
        .safeAreaInset(edge: .bottom) {
            Text(model.status)
                .font(.caption)
                .foregroundStyle(IRTheme.muted)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(.ultraThinMaterial)
        }
        .alert("Error", isPresented: Binding(
            get: { model.errorMessage != nil },
            set: { if !$0 { model.errorMessage = nil } }
        )) {
            Button("OK", role: .cancel) { model.errorMessage = nil }
        } message: {
            Text(model.errorMessage ?? "")
        }
    }
}

struct AssetThumb: View {
    @EnvironmentObject private var model: AppModel
    let assetId: String
    @State private var image: UIImage?

    var body: some View {
        Color.black.opacity(0.35)
            .aspectRatio(1, contentMode: .fill)
            .overlay {
                if let image {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                } else {
                    ProgressView().tint(IRTheme.muted)
                }
            }
            .clipped()
            .task(id: assetId) {
                if let data = try? model.previewJPEG(for: assetId),
                   let ui = UIImage(data: data) {
                    image = ui
                }
            }
    }
}
