import SwiftUI

struct ConnectView: View {
    @EnvironmentObject private var model: AppModel
    @State private var appear = false

    var body: some View {
        VStack(alignment: .leading, spacing: 28) {
            Spacer(minLength: 24)

            VStack(alignment: .leading, spacing: 10) {
                Text("IMMICHROOM")
                    .font(.system(size: 40, weight: .bold, design: .serif))
                    .foregroundStyle(IRTheme.ink)
                    .opacity(appear ? 1 : 0)
                    .offset(y: appear ? 0 : 12)

                Text("Your Immich library. Fast develop on device.")
                    .font(.system(size: 17, weight: .regular, design: .default))
                    .foregroundStyle(IRTheme.muted)
                    .opacity(appear ? 1 : 0)
            }

            VStack(spacing: 14) {
                TextField("Immich URL", text: $model.baseURL)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .keyboardType(.URL)
                    .padding(14)
                    .background(Color.white.opacity(0.06))
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

                SecureField("API key", text: $model.apiKey)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .padding(14)
                    .background(Color.white.opacity(0.06))
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
            .foregroundStyle(IRTheme.ink)

            Button {
                model.connect()
            } label: {
                HStack {
                    if model.isBusy {
                        ProgressView().tint(IRTheme.bgTop)
                    }
                    Text(model.isBusy ? "Connecting…" : "Connect")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(IRTheme.accent)
                .foregroundStyle(IRTheme.bgTop)
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
            .disabled(model.isBusy)

            if let err = model.errorMessage {
                Text(err)
                    .font(.footnote)
                    .foregroundStyle(.red.opacity(0.9))
            }

            Spacer()
        }
        .padding(.horizontal, 24)
        .onAppear {
            withAnimation(.easeOut(duration: 0.55)) { appear = true }
        }
    }
}
