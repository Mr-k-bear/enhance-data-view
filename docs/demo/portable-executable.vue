<template>
    <input type="file" @change="handleFileChange" />
</template>

<script lang="ts" setup>
import { defineArray, defineString, defineStruct, types, get, getArray } from "enhance-data-view";

const IMAGE_DOS_HEADER = defineStruct()
    .addProperty("e_magic", types.WORD)
    .addProperty("e_cblp", types.WORD)
    .addProperty("e_cp", types.WORD)
    .addProperty("e_crlc", types.WORD)
    .addProperty("e_cparhdr", types.WORD)
    .addProperty("e_minalloc", types.WORD)
    .addProperty("e_maxalloc", types.WORD)
    .addProperty("e_ss", types.WORD)
    .addProperty("e_sp", types.WORD)
    .addProperty("e_csum", types.WORD)
    .addProperty("e_ip", types.WORD)
    .addProperty("e_cs", types.WORD)
    .addProperty("e_lfarlc", types.WORD)
    .addProperty("e_ovno", types.WORD)
    .addProperty("e_res", defineArray(types.WORD, 4))
    .addProperty("e_oemid", types.WORD)
    .addProperty("e_oeminfo", types.WORD)
    .addProperty("e_res2", defineArray(types.WORD, 10))
    .addProperty("e_lfanew", types.DWORD)
    .freeze();

const IMAGE_FILE_HEADER = defineStruct()
    .addProperty("Machine", types.WORD)
    .addProperty("NumberOfSections", types.WORD)
    .addProperty("TimeDateStamp", types.DWORD)
    .addProperty("PointerToSymbolTable", types.DWORD)
    .addProperty("NumberOfSymbols", types.DWORD)
    .addProperty("SizeOfOptionalHeader", types.WORD)
    .addProperty("Characteristics", types.WORD)
    .freeze();

const IMAGE_DATA_DIRECTORY = defineStruct()
    .addProperty("VirtualAddress", types.DWORD)
    .addProperty("Size", types.DWORD)
    .freeze();

const IMAGE_OPTIONAL_HEADER = defineStruct()
    .addProperty("Magic", types.WORD)
    .addProperty("MajorLinkerVersion", types.BYTE)
    .addProperty("MinorLinkerVersion", types.BYTE)
    .addProperty("SizeOfCode", types.DWORD)
    .addProperty("SizeOfInitializedData", types.DWORD)
    .addProperty("SizeOfUninitializedData", types.DWORD)
    .addProperty("AddressOfEntryPoint", types.DWORD)
    .addProperty("BaseOfCode", types.DWORD)
    .addProperty("BaseOfData", types.DWORD)
    .addProperty("ImageBase", types.DWORD)
    .addProperty("SectionAlignment", types.DWORD)
    .addProperty("FileAlignment", types.DWORD)
    .addProperty("MajorOperatingSystemVersion", types.WORD)
    .addProperty("MinorOperatingSystemVersion", types.WORD)
    .addProperty("MajorImageVersion", types.WORD)
    .addProperty("MinorImageVersion", types.WORD)
    .addProperty("MajorSubsystemVersion", types.WORD)
    .addProperty("MinorSubsystemVersion", types.WORD)
    .addProperty("Win32VersionValue", types.DWORD)
    .addProperty("SizeOfImage", types.DWORD)
    .addProperty("SizeOfHeaders", types.DWORD)
    .addProperty("CheckSum", types.DWORD)
    .addProperty("Subsystem", types.WORD)
    .addProperty("DllCharacteristics", types.WORD)
    .addProperty("SizeOfStackReserve", types.DWORD)
    .addProperty("SizeOfStackCommit", types.DWORD)
    .addProperty("SizeOfHeapReserve", types.DWORD)
    .addProperty("SizeOfHeapCommit", types.DWORD)
    .addProperty("LoaderFlags", types.DWORD)
    .addProperty("NumberOfRvaAndSizes", types.DWORD)
    .addProperty("DataDirectory", defineArray(IMAGE_DATA_DIRECTORY, 16))
    .freeze();

const IMAGE_NT_HEADERS = defineStruct()
    .addProperty("Signature", types.WORD)
    .addProperty("FileHeader", IMAGE_FILE_HEADER)
    .addProperty("OptionalHeader", IMAGE_OPTIONAL_HEADER)
    .freeze();

const IMAGE_SECTION_HEADER = defineStruct()
    .addProperty("Name", defineString(8, 0))
    .addProperty("Misc",
        defineStruct()
        .addProperty("PhysicalAddress", types.DWORD, { offset: 0 })
        .addProperty("VirtualSize", types.DWORD, { offset: 0 })
        .freeze()
    )
    .addProperty("VirtualAddress", types.DWORD)
    .addProperty("SizeOfRawData", types.DWORD)
    .addProperty("PointerToRawData", types.DWORD)
    .addProperty("PointerToRelocations", types.DWORD)
    .addProperty("PointerToLinenumbers", types.DWORD)
    .addProperty("NumberOfRelocations", types.WORD)
    .addProperty("NumberOfLinenumbers", types.WORD)
    .addProperty("Characteristics", types.DWORD)
    .freeze();

async function handleFileChange(event: Event) {
    if (!(event.target instanceof HTMLInputElement)) {
        return;
    }
    const file: File | undefined = event.target.files?.[0];
    if (!file) {
        return;
    };
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                resolve(reader.result);
            }
            else {
                reject(reader.result);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
    const dataView = new DataView(buffer);
    const dosHeader = get(dataView, IMAGE_DOS_HEADER, 0, true);
    const ntHeader = get(dataView, IMAGE_NT_HEADERS, dosHeader.e_lfanew, true);
    const sectionOffset = IMAGE_NT_HEADERS.offsetOf("OptionalHeader", dosHeader.e_lfanew) + ntHeader.FileHeader.SizeOfOptionalHeader;
    const sections = getArray(dataView, IMAGE_SECTION_HEADER, sectionOffset, ntHeader.FileHeader.NumberOfSections);
    console.log({ dataView, dosHeader, ntHeader, sections });
}
</script>