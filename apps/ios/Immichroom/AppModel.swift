import Foundation
import SwiftUI

@MainActor
final class AppModel: ObservableObject {
    @Published var baseURL: String
    @Published var apiKey: String
    @Published var status: String = "Not connected"
    @Published var assets: [AssetInfo] = []
    @Published var isBusy = false
    @Published var errorMessage: String?

    private var session: ImmichSession?

    private let defaults = UserDefaults.standard
    private let urlKey = "immich.baseURL"
    private let keyKey = "immich.apiKey"

    init() {
        self.baseURL = defaults.string(forKey: urlKey) ?? ""
        self.apiKey = defaults.string(forKey: keyKey) ?? ""
    }

    var isConnected: Bool { session != nil }

    func connect() {
        errorMessage = nil
        isBusy = true
        defer { isBusy = false }

        let url = baseURL.trimmingCharacters(in: .whitespacesAndNewlines)
        let key = apiKey.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !url.isEmpty, !key.isEmpty else {
            errorMessage = "Enter Immich URL and API key"
            return
        }

        do {
            let s = try ImmichSession(baseUrl: url, apiKey: key)
            status = try s.ping()
            session = s
            defaults.set(url, forKey: urlKey)
            defaults.set(key, forKey: keyKey)
            refreshLibrary()
        } catch {
            session = nil
            errorMessage = error.localizedDescription
            status = "Not connected"
        }
    }

    func refreshLibrary() {
        guard let session else { return }
        errorMessage = nil
        isBusy = true
        defer { isBusy = false }
        do {
            assets = try session.listRecent(size: UInt32(60))
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func previewJPEG(for assetId: String) throws -> Data {
        guard let session else { throw AppError.notConnected }
        return try session.downloadPreview(assetId: assetId)
    }

    func saveRecipe(assetId: String, recipeJSON: String) throws {
        guard let session else { throw AppError.notConnected }
        try session.saveRecipe(assetId: assetId, recipeJson: recipeJSON)
    }

    func loadRecipe(assetId: String) throws -> String? {
        guard let session else { throw AppError.notConnected }
        return try session.loadRecipe(assetId: assetId)
    }

    func clearRecipe(assetId: String) throws {
        guard let session else { throw AppError.notConnected }
        try session.clearRecipe(assetId: assetId)
    }
}

enum AppError: LocalizedError {
    case notConnected
    var errorDescription: String? {
        switch self {
        case .notConnected: return "Connect to Immich first"
        }
    }
}
