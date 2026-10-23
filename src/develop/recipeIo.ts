import type { ImmichClient } from '../services/immich';
import type { EditRecipe, ImmichroomMetadataValue } from './types';
import { EDIT_RECIPE_METADATA_KEY } from './types';
import { createEmptyEditRecipe } from './emptyRecipe';

export async function loadEditRecipe(
  client: ImmichClient,
  assetId: string,
): Promise<EditRecipe | null> {
  try {
    const row = await client.getAssetMetadataByKey(assetId, EDIT_RECIPE_METADATA_KEY);
    const value = row?.value as ImmichroomMetadataValue | undefined;
    if (value?.editRecipe?.version === 1) {
      return value.editRecipe;
    }
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Missing key often comes back as 404
    if (message.includes('(404)')) return null;
    throw err;
  }
}

export async function saveEditRecipe(
  client: ImmichClient,
  assetId: string,
  recipe: EditRecipe,
): Promise<void> {
  const value: ImmichroomMetadataValue = { editRecipe: recipe };
  await client.upsertAssetMetadata(assetId, EDIT_RECIPE_METADATA_KEY, value);
}

export async function clearEditRecipe(
  client: ImmichClient,
  assetId: string,
): Promise<void> {
  try {
    await client.deleteAssetMetadataByKey(assetId, EDIT_RECIPE_METADATA_KEY);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('(404)')) return;
    throw err;
  }
}

export function recipeOrEmpty(recipe: EditRecipe | null): EditRecipe {
  return recipe ?? createEmptyEditRecipe();
}
