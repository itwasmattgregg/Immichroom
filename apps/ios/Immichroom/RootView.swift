import SwiftUI

struct RootView: View {
    @EnvironmentObject private var model: AppModel

    var body: some View {
        NavigationStack {
            Group {
                if model.isConnected {
                    LibraryView()
                } else {
                    ConnectView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(IRTheme.background)
        }
        .tint(IRTheme.accent)
    }
}
